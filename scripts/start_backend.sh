#!/bin/bash
# Start StarkMatter Backend Server

echo "🚀 Starting StarkMatter Backend..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if already running
if pgrep -f "python.*api/main.py" > /dev/null || pgrep -f "uvicorn.*main:app" > /dev/null; then
    echo "⚠️  Backend is already running"
    echo "   Use restart_backend.sh to restart"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Create logs directory
mkdir -p logs

# Start backend in background
echo "📦 Starting server..."
nohup python api/main.py > logs/backend.log 2>&1 &

# Get the PID
BACKEND_PID=$!

echo "✅ Backend started with PID: $BACKEND_PID"
echo "📝 Logs: logs/backend.log"
echo "🌐 API: http://localhost:8000"
echo "📚 Docs: http://localhost:8000/docs"
echo ""
echo "To stop: pkill -f 'python.*api/main.py'"
