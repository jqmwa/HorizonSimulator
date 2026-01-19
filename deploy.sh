#!/bin/bash

# Deployment script for Swarms AI with Local LLMs

echo "🚀 Deploying Swarms AI Application..."
echo ""

# Check Python version
echo "📋 Checking Python version..."
python3 --version || { echo "❌ Python 3 not found. Please install Python 3.8+"; exit 1; }

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Download models if not already downloaded
echo "🤖 Checking for local LLM models..."
if [ ! -d "$HOME/.cache/huggingface" ] || [ -z "$(ls -A $HOME/.cache/huggingface 2>/dev/null)" ]; then
    echo "📥 Models not found. Downloading models (this may take a while)..."
    python3 download_models.py
else
    echo "✅ Models already downloaded"
fi

# Create necessary directories
mkdir -p logs
mkdir -p models

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server:"
echo "  source venv/bin/activate"
echo "  python3 server.py"
echo ""
echo "Or use: ./start.sh"
