#!/bin/bash

# Start script for Swarms AI Server

echo "🚀 Starting Swarms AI Server with Local LLMs..."
echo ""

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "⚠️  Virtual environment not found. Run ./deploy.sh first"
    exit 1
fi

# Check if models are loaded
echo "🤖 Initializing local models..."
python3 -c "from local_models import model_manager; model_manager.load_all_models()" || {
    echo "❌ Error loading models. Make sure models are downloaded."
    echo "Run: python3 download_models.py"
    exit 1
}

# Start the server
echo "📡 Starting Flask-SocketIO server..."
echo "Server will be available at: http://localhost:5001"
echo "WebSocket endpoint: ws://localhost:5001/socket.io/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 server.py
