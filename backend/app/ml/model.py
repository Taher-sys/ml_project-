import torch
import torch.nn as nn
import torch.nn.functional as F


class MCDropout(nn.Dropout):
    """
    Dropout layer that remains ACTIVE during inference if mc_dropout_enabled=True,
    allowing Monte Carlo stochastic forward passes.
    """

    def __init__(self, p: float = 0.3):
        super().__init__(p=p)
        self.mc_dropout_enabled = False

    def forward(self, input: torch.Tensor) -> torch.Tensor:
        if self.mc_dropout_enabled or self.training:
            return F.dropout(input, self.p, training=True, inplace=self.inplace)
        return F.dropout(input, self.p, training=False, inplace=self.inplace)


class BayesianNeuralNetwork(nn.Module):
    """
    Bayesian Deep Learning Feedforward Neural Network using Monte Carlo Dropout.
    Architecture: Input (8) -> Linear(64) -> ReLU -> MCDropout(0.3) -> Linear(32) -> ReLU -> MCDropout(0.3) -> Linear(1) -> Sigmoid
    """

    def __init__(self, input_dim: int = 8, hidden_dim1: int = 64, hidden_dim2: int = 32, dropout_p: float = 0.3):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim1)
        self.drop1 = MCDropout(p=dropout_p)
        self.fc2 = nn.Linear(hidden_dim1, hidden_dim2)
        self.drop2 = MCDropout(p=dropout_p)
        self.fc3 = nn.Linear(hidden_dim2, 1)

    def enable_mc_dropout(self, enable: bool = True):
        """Enable or disable MC Dropout across all dropout layers during evaluation."""
        self.drop1.mc_dropout_enabled = enable
        self.drop2.mc_dropout_enabled = enable

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = F.relu(self.fc1(x))
        out = self.drop1(out)
        out = F.relu(self.fc2(out))
        out = self.drop2(out)
        out = torch.sigmoid(self.fc3(out))
        return out


class BaselineNeuralNetwork(nn.Module):
    """
    Deterministic baseline Neural Network (standard dropout off at test time)
    for comparing calibration and trust metrics in README.
    """

    def __init__(self, input_dim: int = 8, hidden_dim1: int = 64, hidden_dim2: int = 32, dropout_p: float = 0.3):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim1)
        self.drop1 = nn.Dropout(p=dropout_p)
        self.fc2 = nn.Linear(hidden_dim1, hidden_dim2)
        self.drop2 = nn.Dropout(p=dropout_p)
        self.fc3 = nn.Linear(hidden_dim2, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = F.relu(self.fc1(x))
        out = self.drop1(out)
        out = F.relu(self.fc2(out))
        out = self.drop2(out)
        out = torch.sigmoid(self.fc3(out))
        return out
