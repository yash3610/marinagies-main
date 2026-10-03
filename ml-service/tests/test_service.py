from app.datasets import FEATURES, generate_dataset
from app.trainers import train_module, predict

def test_datasets_are_reproducible():
    first = generate_dataset("GHOSTTRACE", 120, 2026)
    second = generate_dataset("GHOSTTRACE", 120, 2026)
    assert first[2] == second[2]

def test_specialized_trainers_emit_probabilities():
    for module in FEATURES:
        result = train_module(module, 120, 2026)
        probability, explanation = predict(result.bundle, dict(zip(FEATURES[module], [.9] * len(FEATURES[module]))))
        assert 0 <= probability <= 1
        assert explanation
