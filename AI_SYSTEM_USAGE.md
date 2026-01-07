# StarkMatter AI Analysis System - Usage Guide

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd ui
npm install
```

### 2. Start Services

**Backend** (Terminal 1):
```bash
source venv/bin/activate
python api/main.py
# Server runs on http://localhost:8000
```

**Frontend** (Terminal 2):
```bash
cd ui
npm run dev
# App runs on http://localhost:5173
```

### 3. Access AI Insights

Navigate to: [http://localhost:5173/insights](http://localhost:5173/insights)

---

## Manual Mode Workflow

The system uses **manual execution mode** - you generate prompts, run them in Claude Code, and import the results.

### Step 1: Generate Prompt
1. Select a symbol (e.g., AAPL, TSLA) from dropdown
2. Click one of the Quick Analysis cards:
   - **Technical Analysis** - Chart patterns, indicators, trend analysis
   - **News Sentiment** - Recent news and market sentiment
   - **Trade Idea** - Multi-factor trade recommendation
   - **Portfolio Check** - Diversification and risk analysis
   - **Learn Concepts** - Educational explanations (enter concept like "RSI divergence")

3. Prompt appears in modal - click **"Copy Prompt"**

### Step 2: Run in Claude Code
1. Open Claude Code CLI or web interface
2. Paste the prompt
3. Run and wait for Claude's response
4. Copy Claude's full response

### Step 3: Import Response
1. Back in StarkMatter, click **"Continue"** button
2. Paste Claude's response into the textarea
3. Click **"Import & Save"**
4. Analysis appears in main panel with markdown formatting

---

## Available Analysis Types

### 📊 Technical Analysis
**Template:** `technical/chart_analysis.yaml`

Analyzes price action, trends, patterns, and technical indicators:
- Trend direction and strength
- Support and resistance levels
- RSI, MACD, Bollinger Bands interpretation
- Chart patterns (triangles, H&S, etc.)
- Trade setup with entry/stop/target
- Confidence rating

**Best for:** Daily trading decisions, swing trades

---

### 📰 News Sentiment
**Template:** `sentiment/news_sentiment.yaml`

Analyzes recent news headlines and market sentiment:
- Overall sentiment score (-1 to +1)
- Key themes across headlines
- Positive/negative headline breakdown
- Market impact assessment
- Actionable insights

**Best for:** Event-driven trading, earnings reactions

---

### 💡 Trade Idea
**Template:** `signals/multi_factor_trade.yaml`

Comprehensive trade recommendation combining:
- Technical analysis (40% weight)
- Fundamental/news catalysts (40% weight)
- Market sentiment (20% weight)
- Combined confidence score (requires >= 7/10)
- Precise entry, stop, targets
- Position sizing recommendation
- Risk/reward ratio (requires >= 2:1)
- Risk factors and invalidation scenarios

**Best for:** High-conviction trade ideas

---

### 📈 Portfolio Check
**Template:** `portfolio/diversification.yaml`

Analyzes portfolio concentration and diversification:
- Sector concentration risk
- Single-stock risk (flags positions > 15-20%)
- Missing sectors/asset classes
- Rebalancing recommendations
- Target allocation suggestions
- Overall risk rating

**Best for:** Monthly portfolio reviews, risk management

---

### 📚 Learn Concepts
**Template:** `educational/concept_explainer.yaml`

Educational explanations of trading concepts:
- Simple definition in plain language
- How it works (mechanics)
- Real examples with numbers
- How traders use it
- Strengths and limitations
- Related concepts to learn next

**Best for:** Learning trading terminology, understanding indicators

**Example concepts to try:**
- "RSI divergence"
- "MACD crossover"
- "Bollinger Band squeeze"
- "Head and shoulders pattern"
- "Support and resistance"
- "Position sizing"
- "Risk-reward ratio"

---

## Features

### Smart Data Integration
The system automatically pulls relevant data for each analysis:
- **Market Data:** 30 days of OHLCV data (smart summarization)
- **Technical Indicators:** Latest RSI, MACD, MAs, Bollinger Bands
- **News:** Recent headlines with sentiment scores
- **Reddit:** Social sentiment from wallstreetbets and investing subreddits
- **Portfolio:** Current positions and performance

### Token Budgeting
Each data source has a token budget to fit within Claude's context limits:
- Price data: ~500 tokens (weekly aggregation or key points)
- Indicators: ~300 tokens (current readings with interpretation)
- News: ~400 tokens (10 headlines + sentiment)
- Total prompt: typically 2000-3000 tokens

### Few-Shot Learning
Each template includes example analyses to guide Claude's output:
- Shows expected format
- Demonstrates reasoning pattern
- Improves consistency
- Reduces hallucinations

### Chain-of-Thought Reasoning
Templates guide Claude through step-by-step analysis:
1. Identify trend direction
2. Locate support/resistance
3. Check indicators
4. Look for confluence/divergence
5. Synthesize findings
6. Define trade setup

### Response Parsing
Multi-tier strategy extracts structured data:
- **Tier 1:** JSON blocks (if present)
- **Tier 2:** Markdown sections
- **Tier 3:** Metadata extraction (prices, tickers, percentages)

---

## Analysis History

All analyses are saved in the database with:
- Full prompt and response
- Execution timestamp
- Symbol and template used
- Parsed structured data

**View History:**
- Right sidebar shows recent analyses
- Click to view full analysis
- Delete button to remove

**Filter History:**
- By symbol
- By category
- By date

---

## API Endpoints

Available at [http://localhost:8000/docs](http://localhost:8000/docs)

### Templates
- `GET /api/ai/templates` - List all templates
- `GET /api/ai/templates/{category}/{name}` - Get template details

### Analysis
- `POST /api/ai/render-prompt` - Generate prompt with data
- `POST /api/ai/import-response` - Import Claude response
- `GET /api/ai/history` - Get analysis history
- `GET /api/ai/history/{id}` - Get specific analysis
- `DELETE /api/ai/history/{id}` - Delete analysis

### Health
- `GET /api/ai/health` - Service health check

---

## Template Structure

Templates are YAML files with this structure:

```yaml
name: template_identifier
category: technical|sentiment|signals|portfolio|educational
version: "1.0.0"
description: "What this template does"

metadata:
  temperature: 0.2          # Claude temperature (0.0-1.0)
  max_tokens: 2048          # Maximum response length
  skill_level: "intermediate"

placeholders:
  - name: symbol
    type: string
    required: true
  - name: price_data
    type: data
    source: market_data
    token_budget: 500

few_shot_examples:
  - description: "Example scenario"
    input: { symbol: "AAPL", ... }
    output: "Expected analysis format..."

chain_of_thought:
  enabled: true
  reasoning_steps:
    - "Step 1 description"
    - "Step 2 description"

system_prompt: |
  You are a professional analyst...

user_prompt: |
  Analyze {{ symbol }}...
  {{ price_data }}
  {{ indicators }}
```

---

## Customization

### Adding New Templates

1. Create YAML file in `api/prompts/{category}/`
2. Follow template schema
3. Include few-shot examples
4. Test with real data

### Modifying Templates

Edit YAML files in `api/prompts/`:
- Adjust temperature for creativity vs consistency
- Modify system prompt for different analyst personas
- Add/remove data sources
- Change output format requirements

### Adding Data Sources

Extend `api/services/ai/data_formatter.py`:
```python
def format_new_data_source(self, symbol: str) -> str:
    # Fetch and format new data
    # Apply token budgeting
    # Return formatted string
```

---

## Troubleshooting

### Templates Not Loading
```bash
# Check prompts directory exists
ls api/prompts/

# Test template loading
source venv/bin/activate
cd api
python -c "from services.ai import PromptManager; pm = PromptManager(); print(pm.list_templates())"
```

### Data Not Populating
- Ensure symbol has market data: `GET /api/market/{symbol}/daily`
- Check news aggregation: `GET /api/market/news`
- Verify technical indicators: check `technical_analysis.py`

### Response Import Failing
- Verify response is not empty
- Check for special characters that might break JSON
- Ensure database connection is working

### No Symbols Available
```bash
# Import symbols
curl -X POST http://localhost:8000/api/symbols/import
```

---

## Best Practices

### Prompt Generation
- ✅ Always select a symbol first (for symbol-based analyses)
- ✅ Use fresh data (run daily imports)
- ✅ Review prompt before copying (check data quality)

### Claude Execution
- ✅ Copy entire prompt including system message
- ✅ Run in clean Claude session (no prior context)
- ✅ Wait for complete response
- ✅ Copy full response (don't truncate)

### Response Import
- ✅ Paste complete Claude response
- ✅ Review analysis before saving
- ✅ Check structured data was parsed correctly
- ✅ Add to history for future reference

### Analysis Interpretation
- ⚠️ AI analysis is educational only - not financial advice
- ⚠️ Verify indicator calculations independently
- ⚠️ Cross-reference with other sources
- ⚠️ Use as one input among many

---

## Future Enhancements (Not Yet Implemented)

- ❌ Direct Claude API integration (auto-execution)
- ❌ Multi-step workflows (daily briefings, trade development)
- ❌ Additional 14 templates (total of 19+)
- ❌ Chat interface for interactive analysis
- ❌ TradingViewPro integration
- ❌ Quality metrics and backtesting
- ❌ Case studies database
- ❌ RAG/embeddings for document retrieval

---

## Support

For issues or questions:
1. Check [AI_IMPLEMENTATION_PLAN.md](AI_IMPLEMENTATION_PLAN.md) for technical details
2. Review API docs at http://localhost:8000/docs
3. Examine template YAML files for prompt structure
4. Check browser console for frontend errors
5. Check backend logs for API errors

---

**Version:** Phase 1 - Manual Mode
**Last Updated:** 2026-01-07
