"""
Local LLM Model Manager
Manages 3 small LLM models for local inference without API calls
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import os
from typing import Optional, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LocalModelManager:
    """Manages multiple local LLM models for inference"""
    
    def __init__(self):
        self.models = {}
        self.tokenizers = {}
        self.pipelines = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
        # Model configurations - 3 smallest models
        self.model_configs = {
            'tiny': {
                'name': 'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
                'max_length': 512,
                'temperature': 0.7,
                'load_in_8bit': True if self.device == 'cuda' else False
            },
            'small': {
                'name': 'Qwen/Qwen2.5-0.5B-Instruct',
                'max_length': 512,
                'temperature': 0.7,
                'load_in_8bit': True if self.device == 'cuda' else False
            },
            'medium': {
                'name': 'microsoft/Phi-2',
                'max_length': 512,
                'temperature': 0.7,
                'load_in_8bit': True if self.device == 'cuda' else False
            }
        }
    
    def load_model(self, model_key: str):
        """Load a specific model"""
        if model_key in self.models:
            logger.info(f"Model {model_key} already loaded")
            return True
        
        if model_key not in self.model_configs:
            logger.error(f"Unknown model key: {model_key}")
            return False
        
        config = self.model_configs[model_key]
        model_name = config['name']
        
        try:
            logger.info(f"Loading model: {model_name}...")
            
            # Load tokenizer
            tokenizer = AutoTokenizer.from_pretrained(
                model_name,
                trust_remote_code=True
            )
            
            # Set pad token if not exists
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            
            # Load model with quantization if GPU available
            if config.get('load_in_8bit') and self.device == 'cuda':
                from transformers import BitsAndBytesConfig
                quantization_config = BitsAndBytesConfig(
                    load_in_8bit=True,
                    llm_int8_threshold=6.0
                )
                model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    quantization_config=quantization_config,
                    device_map="auto",
                    trust_remote_code=True,
                    torch_dtype=torch.float16
                )
            else:
                model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    trust_remote_code=True,
                    torch_dtype=torch.float16 if self.device == 'cuda' else torch.float32
                )
                model.to(self.device)
            
            # Create pipeline for easier inference
            pipe = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                device=0 if self.device == 'cuda' else -1,
                torch_dtype=torch.float16 if self.device == 'cuda' else torch.float32
            )
            
            self.models[model_key] = model
            self.tokenizers[model_key] = tokenizer
            self.pipelines[model_key] = pipe
            
            logger.info(f"✅ Successfully loaded {model_name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error loading model {model_name}: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def load_all_models(self):
        """Load all 3 models"""
        logger.info("Loading all local models...")
        results = {}
        for key in self.model_configs.keys():
            results[key] = self.load_model(key)
        return results
    
    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        model_key: str = 'tiny',
        max_tokens: int = 50,
        temperature: float = 0.7,
        **kwargs
    ) -> str:
        """Generate text using a local model"""
        
        if model_key not in self.pipelines:
            logger.warning(f"Model {model_key} not loaded, loading now...")
            if not self.load_model(model_key):
                return "Error: Could not load model"
        
        try:
            # Format prompt based on model type
            if model_key == 'tiny':
                # TinyLlama chat format
                formatted_prompt = f"<|system|>\n{system_prompt}\n<|user|>\n{prompt}\n<|assistant|>\n"
            elif model_key == 'small':
                # Qwen2.5 format
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
                tokenizer = self.tokenizers[model_key]
                formatted_prompt = tokenizer.apply_chat_template(
                    messages,
                    tokenize=False,
                    add_generation_prompt=True
                )
            else:
                # Phi-2 format
                formatted_prompt = f"System: {system_prompt}\n\nUser: {prompt}\n\nAssistant:"
            
            pipe = self.pipelines[model_key]
            config = self.model_configs[model_key]
            
            # Generate
            outputs = pipe(
                formatted_prompt,
                max_new_tokens=max_tokens,
                temperature=temperature,
                do_sample=True,
                top_p=0.95,
                repetition_penalty=1.1,
                pad_token_id=self.tokenizers[model_key].pad_token_id,
                eos_token_id=self.tokenizers[model_key].eos_token_id,
                return_full_text=False,
                **kwargs
            )
            
            # Extract generated text
            generated_text = outputs[0]['generated_text'].strip()
            
            # Clean up response based on model
            if model_key == 'tiny':
                # Remove any remaining tags
                generated_text = generated_text.split('<|assistant|>')[-1].strip()
                generated_text = generated_text.split('<|user|>')[0].strip()
            elif model_key == 'small':
                # Qwen might add extra tokens
                generated_text = generated_text.split('assistant\n')[-1].strip()
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Error generating text: {str(e)}")
            import traceback
            traceback.print_exc()
            return f"Error: {str(e)}"
    
    def get_embedding(self, text: str, model_key: str = 'tiny') -> Optional[List[float]]:
        """Get embedding for text (simple token-based for now)"""
        # For simplicity, we'll use a basic embedding approach
        # In production, you'd want a dedicated embedding model
        try:
            tokenizer = self.tokenizers.get(model_key)
            if not tokenizer:
                return None
            
            tokens = tokenizer.encode(text, return_tensors='pt')
            # Simple average pooling of token embeddings
            model = self.models.get(model_key)
            if model and hasattr(model, 'get_input_embeddings'):
                embeddings = model.get_input_embeddings()(tokens)
                embedding = embeddings.mean(dim=1).squeeze().detach().cpu().numpy().tolist()
                return embedding
        except Exception as e:
            logger.error(f"Error getting embedding: {str(e)}")
        return None


# Global model manager instance
model_manager = LocalModelManager()
