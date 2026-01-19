#!/bin/bash

# Simple HTTP server for the frontend

PORT=${1:-8000}

echo "🌐 Starting frontend server on http://localhost:$PORT"
echo "Open http://localhost:$PORT in your browser"
echo ""
echo "Press Ctrl+C to stop"
echo ""

python3 -m http.server $PORT
