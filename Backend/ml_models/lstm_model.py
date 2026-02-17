"""
LSTM Model for Phishing Email Generation
Built from scratch for PhishAware Senior Project
"""

import torch
import torch.nn as nn


class PhishingLSTM(nn.Module):
    """
    LSTM model for bilingual email generation
    Architecture built from scratch using PyTorch
    """
    
    def __init__(self, vocab_size, embedding_dim=256, hidden_dim=512, num_layers=3, dropout=0.3):
        super(PhishingLSTM, self).__init__()
        
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        # Embedding layer - converts word indices to dense vectors
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=0)
        
        # LSTM layers - core of the model
        self.lstm = nn.LSTM(
            embedding_dim,
            hidden_dim,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0,
            batch_first=True
        )
        
        # Dropout for regularization
        self.dropout = nn.Dropout(dropout)
        
        # Output layer - predicts next word
        self.fc = nn.Linear(hidden_dim, vocab_size)
    
    def forward(self, x, hidden=None):
        """Forward pass through the model"""
        # Embed input
        embedded = self.embedding(x)
        
        # Pass through LSTM
        if hidden is None:
            lstm_out, hidden = self.lstm(embedded)
        else:
            lstm_out, hidden = self.lstm(embedded, hidden)
        
        # Apply dropout
        lstm_out = self.dropout(lstm_out)
        
        # Project to vocabulary size
        output = self.fc(lstm_out)
        
        return output, hidden
    
    def init_hidden(self, batch_size):
        """Initialize hidden state"""
        weight = next(self.parameters())
        return (
            weight.new_zeros(self.num_layers, batch_size, self.hidden_dim),
            weight.new_zeros(self.num_layers, batch_size, self.hidden_dim)
        )