"""
lstm_model.py — LSTM neural network architecture for PhishAware v2 email generation.

Defines EmailLSTM, a multi-layer LSTM with an embedding layer and a linear output head
trained to generate phishing and legitimate email bodies in English and Arabic.
"""
import torch
import torch.nn as nn


class EmailLSTM(nn.Module):
    """Multi-layer LSTM that generates token sequences for phishing/legitimate email bodies."""

    def __init__(self, vocab_size, embedding_dim=256, hidden_dim=512,
                 num_layers=3, dropout=0.3):
        super().__init__()
        self.vocab_size = vocab_size
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        self.dropout = nn.Dropout(dropout)
        self.lstm = nn.LSTM(
            embedding_dim, hidden_dim, num_layers,
            dropout=dropout if num_layers > 1 else 0,
            batch_first=True,
        )
        self.fc = nn.Linear(hidden_dim, vocab_size)

    def forward(self, x, hidden=None):
        """Run one forward step: embed tokens → LSTM → linear projection to vocab logits."""
        embedded = self.dropout(self.embedding(x))
        lstm_out, hidden = self.lstm(embedded, hidden)
        output = self.fc(self.dropout(lstm_out))
        return output, hidden

    def init_hidden(self, batch_size, device):
        """Return zeroed (h0, c0) tensors of the correct shape for a fresh generation pass."""
        h0 = torch.zeros(self.num_layers, batch_size, self.hidden_dim, device=device)
        c0 = torch.zeros(self.num_layers, batch_size, self.hidden_dim, device=device)
        return (h0, c0)
