"""
Email Generator using trained LSTM model
Handles email generation, formatting, and Saudi context
"""

import torch
import json
import os
import re
import random
from pathlib import Path
from .lstm_model import PhishingLSTM


class Vocabulary:
    """Vocabulary for encoding/decoding text"""
    
    def __init__(self, word2idx, idx2word):
        self.word2idx = word2idx
        self.idx2word = idx2word
    
    def tokenize(self, text):
        """Tokenize text (same as training)"""
        text = re.sub(r'[^\w\s\u0600-\u06FF]', ' ', text.lower())
        return text.split()
    
    def encode(self, text):
        """Convert text to indices"""
        words = self.tokenize(text)
        return [self.word2idx.get(word, self.word2idx['<UNK>']) for word in words]
    
    def decode(self, indices):
        """Convert indices back to text"""
        return ' '.join([self.idx2word.get(str(idx), '<UNK>') for idx in indices])


class EmailGenerator:
    """Generates phishing and legitimate emails using trained LSTM"""
    
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.vocab = None
        self.model_loaded = False
        
        # Load model on initialization
        self.load_model()
    
    def load_model(self):
        """Load trained model and vocabulary"""
        try:
            # Get path to ml_models folder
            ml_models_dir = Path(__file__).parent
            
            # Load model config
            config_path = ml_models_dir / 'model_config.json'
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            # Load vocabulary
            vocab_path = ml_models_dir / 'vocab.json'
            with open(vocab_path, 'r', encoding='utf-8') as f:
                vocab_data = json.load(f)
            
            self.vocab = Vocabulary(
                word2idx=vocab_data['word2idx'],
                idx2word=vocab_data['idx2word']
            )
            
            # Initialize model
            self.model = PhishingLSTM(
                vocab_size=config['vocab_size'],
                embedding_dim=config['embedding_dim'],
                hidden_dim=config['hidden_dim'],
                num_layers=config['num_layers'],
                dropout=config['dropout']
            ).to(self.device)
            
            # Load trained weights
            weights_path = ml_models_dir / 'phishing_lstm.pth'
            self.model.load_state_dict(
                torch.load(weights_path, map_location=self.device)
            )
            self.model.eval()
            
            self.model_loaded = True
            print("✓ AI Email Generator loaded successfully")
            
        except Exception as e:
            print(f"✗ Error loading AI model: {e}")
            self.model_loaded = False
    
    def generate_text(self, start_text, max_length=50, temperature=0.7):
        """Generate text from model"""
        
        if not self.model_loaded:
            return start_text  # Fallback to start text if model not loaded
        
        self.model.eval()
        
        # Encode start text
        words = self.vocab.tokenize(start_text)
        input_seq = [self.vocab.word2idx['<START>']]
        input_seq.extend([self.vocab.word2idx.get(w, self.vocab.word2idx['<UNK>']) for w in words])
        
        generated = input_seq.copy()
        
        with torch.no_grad():
            hidden = None
            
            for _ in range(max_length):
                x = torch.tensor([generated]).to(self.device)
                output, hidden = self.model(x, hidden)
                
                logits = output[0, -1, :] / temperature
                probs = torch.softmax(logits, dim=0)
                
                next_word = torch.multinomial(probs, 1).item()
                
                if next_word == self.vocab.word2idx['<END>']:
                    break
                
                generated.append(next_word)
        
        # Decode (skip START token)
        return self.vocab.decode(generated[1:])
    
    def clean_mixed_language(self, text, target_language):
        """Clean up mixed language output"""
        
        if target_language == 'ar':
            # Replace English words with Arabic
            replacements = {
                'hours': 'ساعة',
                'hour': 'ساعة',
                'click': 'اضغط',
                'here': 'هنا',
                'verify': 'تحقق',
                'account': 'حساب',
                'password': 'كلمة المرور',
                'urgent': 'عاجل',
                'important': 'مهم',
                'security': 'أمني',
                'alert': 'تنبيه',
                'will be locked': 'سيتم قفل',
                'suspended': 'معلق',
                'within': 'خلال',
                'or': 'أو',
                'to': 'إلى',
                'your': 'الخاص بك',
            }
            
            for eng, ar in replacements.items():
                text = re.sub(r'\b' + eng + r'\b', ar, text, flags=re.IGNORECASE)
            
            # Convert English numbers to Arabic
            number_map = {
                '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
                '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
            }
            for eng, ar in number_map.items():
                text = text.replace(eng, ar)
        
        return text.strip()
    
    def detect_language(self, text):
        """Detect if text is Arabic or English"""
        arabic_chars = len(re.findall(r'[\u0600-\u06FF]', text))
        total_chars = len(re.findall(r'[a-zA-Z\u0600-\u06FF]', text))
        
        if total_chars == 0:
            return 'en'
        
        return 'ar' if (arabic_chars / total_chars) > 0.3 else 'en'
    
    def get_saudi_starter(self, email_type, language):
        """Get Saudi-specific starter text"""
        
        starters = {
            'phishing': {
                'en': [
                    'urgent verify your account',
                    'security alert unusual activity',
                    'your payment has failed',
                    'package delivery failed',
                    'password will expire soon',
                ],
                'ar': [
                    'عاجل يرجى تحديث حساب أبشر',
                    'تنبيه أمني نشاط غير عادي',
                    'رسالة من سداد فاتورة متأخرة',
                    'البريد السعودي طرد معلق',
                    'بنك تحذير أمني',
                ]
            },
            'legitimate': {
                'en': [
                    'meeting scheduled for tomorrow',
                    'weekly team update',
                    'document shared with you',
                    'invoice attached payment due',
                    'training session reminder',
                ],
                'ar': [
                    'اجتماع الفريق غداً الساعة',
                    'تحديث أسبوعي تقدم المشروع',
                    'مستند مشارك معك للمراجعة',
                    'فاتورة مرفقة الدفع مستحق',
                    'تذكير الدورة التدريبية',
                ]
            }
        }
        
        return random.choice(starters[email_type][language])
    
    def structure_email(self, ai_text, email_type, language, employee_name, company_name):
        """Create full email structure from AI-generated text"""
        
        # Clean mixed language
        ai_text = self.clean_mixed_language(ai_text, language)
        
        if language == 'ar':
            return self._create_arabic_email(ai_text, email_type, employee_name, company_name)
        else:
            return self._create_english_email(ai_text, email_type, employee_name, company_name)
    
    def _create_arabic_email(self, core_text, email_type, employee_name, company_name):
        """Create Arabic email"""
        
        if email_type == 'phishing':
            # Saudi phishing templates
            subjects = [
                'عاجل: تحديث حساب أبشر المطلوب',
                'تنبيه أمني: نشاط غير عادي',
                'سداد: فاتورة متأخرة',
                'البريد السعودي: طرد معلق',
            ]
            
            body = f"""
عزيزي {employee_name},

{core_text}.

يرجى اتخاذ الإجراء اللازم خلال ٢٤ ساعة لتجنب تعليق الحساب.

شكراً،
فريق الدعم
            """.strip()
        
        else:  # legitimate
            subjects = [
                f'رسالة من {company_name}',
                'تحديث مهم',
                'إشعار',
            ]
            
            body = f"""
مرحباً {employee_name},

{core_text}.

شكراً لتعاونكم.

مع أطيب التحيات،
{company_name}
            """.strip()
        
        return {
            'subject': random.choice(subjects),
            'body': body,
            'language': 'ar',
            'type': email_type
        }
    
    def _create_english_email(self, core_text, email_type, employee_name, company_name):
        """Create English email"""
        
        if email_type == 'phishing':
            subjects = [
                'Urgent: Account Verification Required',
                'Security Alert: Unusual Activity Detected',
                'Payment Failed - Action Required',
                'Package Delivery Failed',
            ]
            
            body = f"""
Dear {employee_name},

{core_text}.

Please take action within 24 hours to avoid account suspension.

Thank you,
Support Team
            """.strip()
        
        else:  # legitimate
            subjects = [
                f'Message from {company_name}',
                'Important Update',
                'Notification',
            ]
            
            body = f"""
Hello {employee_name},

{core_text}.

Thank you for your cooperation.

Best regards,
{company_name}
            """.strip()
        
        return {
            'subject': random.choice(subjects),
            'body': body,
            'language': 'en',
            'type': email_type
        }
    
    def generate_email(self, email_type='phishing', language='en', employee_name='User', company_name='Company'):
        """
        Generate a complete email
        
        Args:
            email_type: 'phishing' or 'legitimate'
            language: 'en' or 'ar'
            employee_name: Recipient name
            company_name: Company name
        
        Returns:
            dict with subject, body, language, type
        """
        
        # Get Saudi-specific starter
        starter = self.get_saudi_starter(email_type, language)
        
        # Generate core text from AI
        ai_text = self.generate_text(starter, max_length=40, temperature=0.7)
        
        # Structure into full email
        email = self.structure_email(ai_text, email_type, language, employee_name, company_name)
        
        return email


# Global instance
email_generator = EmailGenerator()