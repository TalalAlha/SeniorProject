"""
vocabulary.py — Token-to-index mapping for the PhishAware v2 LSTM models.

Provides the Vocabulary class used to convert raw text to integer token sequences
(for model input) and to decode integer sequences back to human-readable text
(for generation output). Separate vocab files are loaded for English and Arabic.
"""
import json
import re


class Vocabulary:
    """Word-to-index (and reverse) mapping with special tokens for the LSTM models."""

    PAD_TOKEN = '<PAD>'
    START_TOKEN = '<START>'
    END_TOKEN = '<END>'
    UNK_TOKEN = '<UNK>'

    def __init__(self):
        self.word2idx = {}
        self.idx2word = {}

    def decode(self, indices):
        """Convert a list of token indices back to a cleaned text string."""
        # Skip padding, start, and unknown tokens; stop at end token
        _skip = (self.PAD_TOKEN, self.START_TOKEN, self.UNK_TOKEN)
        words = []
        for idx in indices:
            word = self.idx2word.get(idx, self.UNK_TOKEN)
            if word == self.END_TOKEN:
                break
            if word not in _skip:
                words.append(word)
        text = ' '.join(words)
        # Remove spaces before punctuation that the tokenizer may have inserted
        text = re.sub(r'\s+([.,!?;:])', r'\1', text)
        return text

    @classmethod
    def load(cls, filepath):
        """Load a vocabulary from a JSON file produced during model training."""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        vocab = cls()
        vocab.word2idx = data['word2idx']
        # JSON keys are always strings; convert back to int for fast index lookup
        vocab.idx2word = {int(k): v for k, v in data['idx2word'].items()}
        return vocab

    def __len__(self):
        """Return the total number of tokens in the vocabulary."""
        return len(self.word2idx)
