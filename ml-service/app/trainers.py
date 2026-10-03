from dataclasses import dataclass
import numpy as np
import torch
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import OneClassSVM
from xgboost import XGBClassifier
from .datasets import FEATURES, generate_dataset, make_sequences
from .neural import train_autoencoder, train_sequence_model

@dataclass
class TrainingResult:
    bundle: dict
    metrics: dict
    dataset_hash: str
    training_count: int
    holdout_count: int
    positive_count: int
    negative_count: int

def _metrics(labels, probabilities, threshold=.5):
    predictions = (np.asarray(probabilities) >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(labels, predictions, labels=[0, 1]).ravel()
    specificity = tn / (tn + fp) if tn + fp else 0
    return {"accuracy": float(accuracy_score(labels, predictions)), "precision": float(precision_score(labels, predictions, zero_division=0)), "recall": float(recall_score(labels, predictions, zero_division=0)), "f1": float(f1_score(labels, predictions, zero_division=0)), "specificity": float(specificity), "falsePositiveRate": float(1 - specificity), "confusionMatrix": {"truePositive": int(tp), "trueNegative": int(tn), "falsePositive": int(fp), "falseNegative": int(fn)}}

def train_module(module: str, sample_count: int, seed: int) -> TrainingResult:
    values, labels, dataset_hash = generate_dataset(module, sample_count, seed)
    x_train, x_test, y_train, y_test = train_test_split(values, labels, test_size=.25, random_state=seed, stratify=labels)
    scaler = StandardScaler().fit(x_train); train_scaled = scaler.transform(x_train); test_scaled = scaler.transform(x_test)
    if module == "GHOSTTRACE":
        isolation = IsolationForest(n_estimators=180, contamination=.08, random_state=seed).fit(train_scaled[y_train == 0])
        train_seq = make_sequences(x_train, 8, seed); test_seq = make_sequences(x_test, 8, seed + 1); lstm = train_sequence_model(train_seq, y_train)
        with torch.no_grad(): lstm_prob = torch.sigmoid(lstm(torch.tensor(test_seq, dtype=torch.float32))).numpy()
        raw = -isolation.decision_function(test_scaled); iso_prob = 1 / (1 + np.exp(-8 * raw)); probabilities = .4 * iso_prob + .6 * lstm_prob
        bundle = {"algorithm": "ISOLATION_FOREST_LSTM", "isolation": isolation, "lstm": lstm, "scaler": scaler, "sequence_length": 8, "threshold": .5}
    elif module == "EDGEARMOR":
        normal = train_scaled[y_train == 0]; svm = OneClassSVM(nu=.08, gamma="scale").fit(normal); autoencoder = train_autoencoder(normal)
        with torch.no_grad(): reconstructed = autoencoder(torch.tensor(test_scaled, dtype=torch.float32)).numpy()
        error = np.mean((reconstructed - test_scaled) ** 2, axis=1); svm_prob = 1 / (1 + np.exp(5 * svm.decision_function(test_scaled))); ae_prob = np.clip(error / max(np.percentile(error[y_test == 0], 95), 1e-6), 0, 1); probabilities = .5 * svm_prob + .5 * ae_prob
        threshold = float(np.percentile(probabilities[y_test == 0], 94)); bundle = {"algorithm": "ONE_CLASS_SVM_AUTOENCODER", "svm": svm, "autoencoder": autoencoder, "scaler": scaler, "error_scale": float(max(np.percentile(error[y_test == 0], 95), 1e-6)), "threshold": threshold}
    elif module == "ROCSHIELD":
        classifier = XGBClassifier(n_estimators=160, max_depth=4, learning_rate=.06, subsample=.9, colsample_bytree=.9, eval_metric="logloss", random_state=seed).fit(x_train, y_train); probabilities = classifier.predict_proba(x_test)[:, 1]
        bundle = {"algorithm": "XGBOOST_COMMAND_CLASSIFIER", "classifier": classifier, "threshold": .5}
    else:
        classifier = RandomForestClassifier(n_estimators=220, max_depth=7, class_weight="balanced", random_state=seed).fit(x_train, y_train); probabilities = classifier.predict_proba(x_test)[:, 1]
        bundle = {"algorithm": "RANDOM_FOREST_SEQUENCE_CLASSIFIER", "classifier": classifier, "threshold": .5}
    bundle.update({"module": module, "feature_names": FEATURES[module], "seed": seed})
    return TrainingResult(bundle, _metrics(y_test, probabilities, bundle["threshold"]), dataset_hash, len(x_train), len(x_test), int(labels.sum()), int((labels == 0).sum()))

def predict(bundle: dict, features: dict, sequence=None) -> tuple[float, dict]:
    names = bundle["feature_names"]; row = np.asarray([[float(features.get(name, 0)) for name in names]], dtype=np.float32); module = bundle["module"]
    if module == "GHOSTTRACE":
        scaled = bundle["scaler"].transform(row); iso = float(1 / (1 + np.exp(8 * bundle["isolation"].decision_function(scaled)[0])))
        seq = np.asarray(sequence, dtype=np.float32) if sequence else np.repeat(row[:, None, :], bundle["sequence_length"], axis=1)
        if seq.ndim == 2: seq = seq[None, :, :]
        with torch.no_grad(): lstm = float(torch.sigmoid(bundle["lstm"](torch.tensor(seq, dtype=torch.float32)))[0])
        return .4 * iso + .6 * lstm, {"isolationForest": iso, "lstm": lstm}
    if module == "EDGEARMOR":
        scaled = bundle["scaler"].transform(row); svm = float(1 / (1 + np.exp(5 * bundle["svm"].decision_function(scaled)[0])))
        with torch.no_grad(): restored = bundle["autoencoder"](torch.tensor(scaled, dtype=torch.float32)).numpy()
        ae = float(np.clip(np.mean((restored - scaled) ** 2) / bundle["error_scale"], 0, 1)); return .5 * svm + .5 * ae, {"oneClassSvm": svm, "autoencoder": ae}
    classifier = bundle["classifier"]; probability = float(classifier.predict_proba(row)[0, 1]); return probability, {"classifier": probability}
