#!/bin/bash
# Test script for AI Analysis System

set -e

echo "🧪 Testing StarkMatter AI Analysis System"
echo "=========================================="
echo ""

# Activate virtual environment
echo "1️⃣  Activating virtual environment..."
source venv/bin/activate

# Test Python imports
echo "2️⃣  Testing Python modules..."
cd api

python -c "
from services.ai import PromptManager, DataFormatter, ResponseParser
print('✅ All AI modules imported successfully')
"

# Test template loading
echo "3️⃣  Testing template loading..."
python -c "
from services.ai import PromptManager
pm = PromptManager()
templates = pm.list_templates()
print(f'✅ Loaded {len(templates)} templates:')
for t in templates:
    print(f'   - {t[\"category\"]}/{t[\"name\"]}')
"

# Test data formatter
echo "4️⃣  Testing data formatter..."
python -c "
from services.ai import DataFormatter
df = DataFormatter()
# Test with a common symbol
result = df.format_market_data('AAPL', days=30, token_budget=500)
print(f'✅ Data formatter working (generated {len(result)} characters)')
"

# Test prompt rendering
echo "5️⃣  Testing prompt rendering..."
python -c "
from services.ai import PromptManager
pm = PromptManager()
template = pm.load_template('educational', 'concept_explainer')
rendered = pm.render_template(template, {
    'concept': 'RSI divergence',
    'detail_level': 'intermediate'
})
print(f'✅ Prompt rendered successfully ({len(rendered)} characters)')
print(f'   First 100 chars: {rendered[:100]}...')
"

# Test response parser
echo "6️⃣  Testing response parser..."
python -c "
from services.ai import ResponseParser
parser = ResponseParser()
sample_response = '''
## Analysis
This is a test.

**Entry**: \$150.00
**Stop Loss**: \$145.00
'''
parsed = parser.parse(sample_response, 'trade_signal')
print(f'✅ Response parser working')
print(f'   Sections found: {list(parsed.sections.keys())}')
print(f'   Metadata extracted: {list(parsed.metadata.keys())}')
"

cd ..

echo ""
echo "✅ All tests passed!"
echo ""
echo "📝 Next steps:"
echo "   1. Start backend: python api/main.py"
echo "   2. Start frontend: cd ui && npm run dev"
echo "   3. Open http://localhost:5173/insights"
echo ""
