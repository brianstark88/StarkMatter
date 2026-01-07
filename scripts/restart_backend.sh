#!/bin/bash
# Restart StarkMatter Backend Server

echo "🔄 Restarting StarkMatter Backend..."

# Find and kill existing backend process
pkill -f "python.*api/main.py" || pkill -f "uvicorn.*main:app"

# Wait for process to die
sleep 2

# Navigate to project root
cd "$(dirname "$0")/.."

# Activate virtual environment
source venv/bin/activate

# Start backend in background
echo "🚀 Starting backend..."
nohup python api/main.py > logs/backend.log 2>&1 &

# Get the PID
BACKEND_PID=$!

echo "✅ Backend restarted with PID: $BACKEND_PID"
echo "📝 Logs: logs/backend.log"
