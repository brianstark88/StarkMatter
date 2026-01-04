#!/bin/bash
# StarkMatter Trading Platform - Deployment Script
# Sets up the development environment for local deployment

set -e  # Exit on error

echo "=========================================="
echo "StarkMatter Trading Platform"
echo "Local Deployment Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Please install it first."
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "✅ Found: $PYTHON_VERSION"
echo ""

# Check Node.js (optional, for UI)
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Found: Node $NODE_VERSION"
else
    echo "⚠️  Node.js not found. UI development will be limited."
fi
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo "Project root: $PROJECT_ROOT"
echo ""

# Create virtual environment
echo "Creating Python virtual environment..."
if [ -d "venv" ]; then
    echo "⚠️  Virtual environment already exists. Skipping creation."
else
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip -q
echo "✅ pip upgraded"
echo ""

# Install Python dependencies
echo "Installing Python dependencies..."
echo "This may take a few minutes..."
pip install -r requirements.txt -q
echo "✅ Python dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "${YELLOW}⚠️  IMPORTANT: Edit .env file to add your API keys${NC}"
    echo "   - ALPHA_VANTAGE_API_KEY: https://www.alphavantage.co/support/#api-key"
    echo "   - FRED_API_KEY: https://fred.stlouisfed.org/docs/api/api_key.html"
    echo "   - REDDIT_CLIENT_ID & SECRET: https://www.reddit.com/prefs/apps"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Create data directories
echo "Creating data directories..."
mkdir -p data/backups
mkdir -p logs
mkdir -p reports
echo "✅ Data directories created"
echo ""

# Initialize database
echo "Initializing database..."
python3 -c "import sys; sys.path.append('api'); from database import init_database; init_database()"
echo "✅ Database initialized"
echo ""

# Install UI dependencies (if package.json exists)
if [ -f "ui/package.json" ]; then
    echo "Installing UI dependencies..."
    cd ui
    if command -v npm &> /dev/null; then
        npm install -q
        echo "✅ UI dependencies installed"
    else
        echo "⚠️  npm not found. Skipping UI setup."
    fi
    cd ..
    echo ""
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Python
venv/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
dist/
build/

# Environment
.env
.env.local

# Database
data/
*.db
*.sqlite

# Logs
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Node
node_modules/
.npm/
EOF
    echo "✅ .gitignore created"
    echo ""
fi

echo "=========================================="
echo "${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env file with your API keys:"
echo "   nano .env"
echo ""
echo "2. Start the backend server:"
echo "   ./scripts/start.sh"
echo ""
echo "   Or manually:"
echo "   cd api && python -m uvicorn main:app --reload"
echo ""
echo "3. (Optional) Start the frontend:"
echo "   cd ui && npm run dev"
echo ""
echo "4. Access the API documentation:"
echo "   http://localhost:8000/docs"
echo ""
echo "5. Use Claude Code for analysis:"
echo "   python scripts/claude_helpers.py morning"
echo ""
echo "=========================================="
