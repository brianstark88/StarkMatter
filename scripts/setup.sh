#!/bin/bash

# StarkMatter - Initial Setup Script
# Run this script once to set up the development environment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}Setting up StarkMatter Development Environment...${NC}\n"

# Check Python version
echo -e "${GREEN}Checking Python version...${NC}"
python3 --version

# Create virtual environment
echo -e "\n${GREEN}Creating Python virtual environment...${NC}"
if [ -d "venv" ]; then
    echo -e "${RED}Virtual environment already exists. Skipping.${NC}"
else
    python3 -m venv venv
    echo -e "${GREEN}Virtual environment created${NC}"
fi

# Activate virtual environment and install dependencies
echo -e "\n${GREEN}Installing Python dependencies...${NC}"
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Set up frontend
echo -e "\n${GREEN}Installing frontend dependencies...${NC}"
cd ui
npm install

# Create .env file if it doesn't exist
cd "$PROJECT_ROOT"
if [ ! -f ".env" ]; then
    echo -e "\n${GREEN}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}.env file created${NC}"
else
    echo -e "\n${BLUE}.env file already exists${NC}"
fi

# Create logs directory
mkdir -p logs

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "${BLUE}To start the development servers, run: ./scripts/start.sh${NC}"
