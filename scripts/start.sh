#!/bin/bash

# StarkMatter - Start Development Servers
# This script starts both the backend and frontend development servers

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}Starting StarkMatter Development Environment...${NC}\n"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${RED}Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Start backend in background
echo -e "${GREEN}Starting Backend Server (FastAPI)...${NC}"
cd api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"
echo -e "${BLUE}Backend URL: http://localhost:8000${NC}\n"

# Wait for backend to be ready
sleep 2

# Start frontend
cd "$PROJECT_ROOT/ui"
echo -e "${GREEN}Starting Frontend Server (Vite)...${NC}"
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "${BLUE}Frontend URL: http://localhost:5173${NC}\n"

echo -e "${GREEN}StarkMatter is running!${NC}"
echo -e "${BLUE}To stop, run: ./scripts/stop.sh${NC}"
echo -e "${BLUE}Logs are available in: logs/backend.log and logs/frontend.log${NC}"
