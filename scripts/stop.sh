#!/bin/bash

# StarkMatter - Stop Development Servers
# This script stops both the backend and frontend development servers

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${GREEN}Stopping StarkMatter Development Environment...${NC}\n"

# Stop backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo -e "${GREEN}Backend stopped (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${RED}Backend process not found${NC}"
    fi
    rm logs/backend.pid
fi

# Stop frontend
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo -e "${GREEN}Frontend stopped (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${RED}Frontend process not found${NC}"
    fi
    rm logs/frontend.pid
fi

echo -e "\n${GREEN}StarkMatter stopped successfully${NC}"
