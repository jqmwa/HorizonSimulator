"""
Download script for local LLM models
Downloads the 3 smallest models for offline use
"""

from transformers import AutoTokenizer, AutoModelForCausalLM
import os

models_to_download = [
    'TinyLlama/TinyLlama-1.1B-Chat-v1.0',
    'Qwen/Qwen2.5-0.5B-Instruct',
    'microsoft/Phi-2'
]

print("🚀 Downloading 3 small LLM models...")
print("This may take a while depending on your internet connection.\n")

for i, model_name in enumerate(models_to_download, 1):
    print(f"[{i}/3] Downloading {model_name}...")
    try:
        # Download tokenizer
        print(f"  📥 Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        
        # Download model
        print(f"  📥 Downloading model weights...")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            trust_remote_code=True,
            torch_dtype='float16'  # Use half precision to save space
        )
        
        print(f"  ✅ {model_name} downloaded successfully!\n")
        
    except Exception as e:
        print(f"  ❌ Error downloading {model_name}: {str(e)}\n")
        import traceback
        traceback.print_exc()

print("✅ All models downloaded! You can now run the server with local models.")
