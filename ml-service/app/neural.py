import torch
from torch import nn

class SequenceClassifier(nn.Module):
    def __init__(self, feature_count: int, hidden_size: int = 16):
        super().__init__()
        self.lstm = nn.LSTM(feature_count, hidden_size, batch_first=True)
        self.output = nn.Linear(hidden_size, 1)

    def forward(self, values: torch.Tensor) -> torch.Tensor:
        sequence, _ = self.lstm(values)
        return self.output(sequence[:, -1, :]).squeeze(-1)

class Autoencoder(nn.Module):
    def __init__(self, feature_count: int):
        super().__init__()
        width = max(3, feature_count // 2)
        self.network = nn.Sequential(nn.Linear(feature_count, width), nn.ReLU(), nn.Linear(width, feature_count), nn.Sigmoid())

    def forward(self, values: torch.Tensor) -> torch.Tensor:
        return self.network(values)

def train_sequence_model(x, y, epochs: int = 35) -> SequenceClassifier:
    torch.manual_seed(42)
    model = SequenceClassifier(x.shape[2]); optimizer = torch.optim.Adam(model.parameters(), lr=.012); loss_fn = nn.BCEWithLogitsLoss()
    inputs = torch.tensor(x, dtype=torch.float32); labels = torch.tensor(y, dtype=torch.float32)
    model.train()
    for _ in range(epochs):
        optimizer.zero_grad(); loss = loss_fn(model(inputs), labels); loss.backward(); optimizer.step()
    model.eval(); return model

def train_autoencoder(normal_x, epochs: int = 60) -> Autoencoder:
    torch.manual_seed(42)
    model = Autoencoder(normal_x.shape[1]); optimizer = torch.optim.Adam(model.parameters(), lr=.015); loss_fn = nn.MSELoss()
    inputs = torch.tensor(normal_x, dtype=torch.float32)
    model.train()
    for _ in range(epochs):
        optimizer.zero_grad(); loss = loss_fn(model(inputs), inputs); loss.backward(); optimizer.step()
    model.eval(); return model
