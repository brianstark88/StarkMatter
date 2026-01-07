# AI Analysis Prompt Engineering Research

## Master Research Prompt

You are an expert AI research specialist with deep expertise in:
- Financial markets analysis and trading strategies
- Technical analysis indicators and interpretation
- Fundamental analysis methodologies
- Sentiment analysis from news and social media
- Machine learning for financial prediction
- Risk management and portfolio optimization
- Prompt engineering for financial AI systems

## Your Mission

Conduct comprehensive research to design the optimal prompts and analytical processes for StarkMatter - a local-first trading platform with AI-powered insights. The system currently has:

### Current System Architecture
1. **Data Sources**:
   - Real-time stock quotes via WebSocket
   - Historical OHLCV data (Open, High, Low, Close, Volume)
   - Technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands)
   - News articles from financial RSS feeds
   - Reddit sentiment data from trading subreddits
   - Economic indicators from FRED API (GDP, unemployment, inflation, etc.)
   - 175+ tracked symbols across 12 sectors

2. **Technical Analysis Capabilities**:
   - Price action analysis
   - Volume analysis
   - Trend identification
   - Support/resistance levels
   - Chart patterns
   - Multiple timeframe analysis

3. **User Interface**:
   - Professional TradingView-style charts
   - Paper trading functionality
   - Symbol browser and search
   - Real-time watchlist
   - News and sentiment dashboard

## Research Objectives

### 1. Technical Analysis Prompts
Design prompts that enable the AI to:
- **Analyze chart patterns** (head & shoulders, triangles, flags, double tops/bottoms)
- **Identify trends** (uptrend, downtrend, consolidation, reversal signals)
- **Interpret indicator combinations** (e.g., RSI divergence with MACD crossover)
- **Calculate support/resistance levels** using multiple methods
- **Recognize candlestick patterns** (doji, hammer, engulfing, etc.)
- **Perform multi-timeframe analysis** (correlating 1D, 1W, 1M signals)
- **Generate confidence scores** for each technical signal

**Output Format**: Provide specific prompt templates with placeholders for data inputs.

### 2. Fundamental Analysis Prompts
Design prompts for:
- **Valuation analysis** (P/E, P/B, PEG ratios, DCF models)
- **Financial health assessment** (debt ratios, cash flow, profitability)
- **Growth analysis** (revenue growth, earnings growth, market share)
- **Sector comparison** (relative valuation, sector rotation signals)
- **Economic indicator correlation** (how Fed rates, GDP, inflation affect sectors)
- **Risk assessment** (beta, volatility, drawdown analysis)

**Output Format**: Provide structured prompts that produce actionable insights.

### 3. Sentiment Analysis Prompts
Design prompts to:
- **Analyze news headlines** for bullish/bearish sentiment
- **Extract key events** from news (earnings, FDA approvals, mergers, lawsuits)
- **Quantify sentiment** from Reddit posts and comments
- **Identify trending narratives** across multiple sources
- **Detect sentiment shifts** (from bullish to bearish or vice versa)
- **Correlate sentiment with price action** (sentiment-driven moves vs. fundamentals)
- **Flag contrarian indicators** (extreme bullishness as a sell signal)

**Output Format**: Provide prompts that output sentiment scores, key themes, and trading implications.

### 4. Trade Signal Generation Prompts
Design prompts that synthesize:
- **Multi-factor analysis** (technical + fundamental + sentiment)
- **Entry/exit recommendations** with specific price levels
- **Risk/reward ratios** and position sizing guidance
- **Stop-loss and take-profit levels** based on volatility and support/resistance
- **Trade justification** (why this trade, what's the edge)
- **Alternative scenarios** (bull case, bear case, neutral case)
- **Confidence levels** (high/medium/low conviction trades)

**Output Format**: Provide structured trade signal prompts with all necessary components.

### 5. Portfolio & Risk Management Prompts
Design prompts for:
- **Portfolio diversification analysis** (sector exposure, correlation matrix)
- **Risk assessment** (VaR, maximum drawdown, Sharpe ratio)
- **Position sizing** based on account size and risk tolerance
- **Hedging strategies** (protective puts, sector hedges)
- **Rebalancing recommendations** (when to trim winners, add to losers)
- **Performance attribution** (what's working, what's not)

**Output Format**: Provide prompts that help users manage portfolio risk effectively.

### 6. Market Regime Detection Prompts
Design prompts to identify:
- **Bull vs. bear markets** using multiple indicators
- **High vs. low volatility regimes** (VIX, ATR-based)
- **Risk-on vs. risk-off sentiment** (sector rotation, safe haven flows)
- **Trending vs. ranging markets** (ADX, price action)
- **Economic cycle phase** (expansion, peak, contraction, trough)
- **Sector rotation patterns** (which sectors lead in each regime)

**Output Format**: Provide prompts that classify current market conditions and recommend strategies.

### 7. Educational & Explanation Prompts
Design prompts that:
- **Explain technical indicators** in simple terms
- **Teach trading concepts** (risk management, position sizing)
- **Provide market commentary** on daily moves
- **Answer "why" questions** (why did the stock move, why did this indicator trigger)
- **Suggest learning resources** based on user skill level

**Output Format**: Provide educational prompts that make complex concepts accessible.

## Research Methodology

For each category above, provide:

1. **Best Practices**:
   - What makes a financial analysis prompt effective?
   - How to structure inputs for maximum clarity?
   - How to request outputs in actionable formats?
   - How to chain prompts for complex multi-step analysis?

2. **Prompt Templates**:
   - Provide 3-5 concrete prompt templates per category
   - Include placeholder syntax for data insertion (e.g., `{symbol}`, `{price_data}`, `{indicators}`)
   - Show example inputs and expected outputs
   - Indicate required vs. optional parameters

3. **Prompt Engineering Techniques**:
   - **Few-shot learning**: When to provide examples vs. zero-shot
   - **Chain-of-thought**: How to get step-by-step reasoning
   - **Role assignment**: What expert personas work best (trader, analyst, economist)
   - **Output formatting**: JSON, markdown, structured text
   - **Temperature settings**: When to use creative vs. deterministic outputs

4. **Data Preparation**:
   - How to format OHLCV data for prompts?
   - How to summarize technical indicators?
   - How to present news articles for analysis?
   - How to structure multi-timeframe data?
   - Optimal data window sizes (how many days/weeks of history)?

5. **Validation & Quality Control**:
   - How to detect hallucinations in financial analysis?
   - How to verify indicator calculations?
   - How to cross-check AI recommendations?
   - How to measure prompt effectiveness?
   - How to A/B test different prompt formulations?

6. **Integration Patterns**:
   - **Single-shot analysis**: One prompt, one response
   - **Multi-step workflows**: Chained prompts building on each other
   - **Streaming analysis**: Real-time processing as data arrives
   - **Batch processing**: Analyzing multiple symbols efficiently
   - **Interactive refinement**: User asks follow-up questions

7. **Ethical Considerations**:
   - How to clearly communicate that AI analysis is not financial advice?
   - How to present uncertainty and confidence intervals?
   - How to avoid overconfidence in predictions?
   - How to encourage responsible risk management?

## Deliverables

Please provide a comprehensive research document with:

### Section 1: Executive Summary
- Key findings and recommendations
- Top 10 most important prompt patterns for trading analysis
- Quick-start guide for implementing prompts in StarkMatter

### Section 2: Detailed Prompt Library
For each of the 7 categories above:
- 5-10 production-ready prompt templates
- Example inputs and outputs
- Best practices and anti-patterns
- Integration guidance

### Section 3: Workflow Architectures
- 3-5 complete end-to-end analytical workflows
- Example: "Daily Market Analysis Workflow"
  - Step 1: Analyze overnight news with Prompt X
  - Step 2: Check technical levels with Prompt Y
  - Step 3: Generate watchlist with Prompt Z
  - Step 4: Present insights to user

### Section 4: Technical Implementation Guide
- How to construct prompts programmatically
- How to inject data into templates
- How to parse and validate outputs
- Error handling and fallback strategies
- Performance optimization (caching, batching)

### Section 5: Evaluation Framework
- Metrics for measuring prompt quality
- Backtesting methodology for trade signals
- User feedback collection
- Continuous improvement process

### Section 6: Advanced Topics
- Using embeddings for similarity search (find stocks with similar patterns)
- Fine-tuning strategies for custom models
- Multi-modal analysis (charts as images + text)
- Reinforcement learning for strategy optimization
- Ensemble methods (combining multiple AI models)

### Section 7: Case Studies
Provide 3-5 detailed examples showing:
- The specific prompt used
- The data provided
- The AI's response
- How the insight was actionable
- The outcome (if it was a trade recommendation)

## Research Standards

Your research should be:
- **Evidence-based**: Cite sources, reference academic papers, industry best practices
- **Practical**: Focus on what works in production, not theoretical exercises
- **Comprehensive**: Cover all major aspects of financial analysis
- **Actionable**: Provide specific implementations, not vague guidelines
- **Up-to-date**: Incorporate latest advances in LLM capabilities (2024-2025)
- **Critical**: Acknowledge limitations, discuss failure modes

## Output Format

Structure your response as a detailed markdown document with:
- Clear section headers
- Code blocks for prompt templates
- Tables for comparisons
- Bullet points for best practices
- Example JSON/data structures
- Mermaid diagrams for workflows (if helpful)

## Additional Context

StarkMatter is designed for:
- **Retail traders**: Not institutions, so focus on accessible language
- **Local-first**: All data and analysis runs locally, privacy-focused
- **Paper trading**: Users can test strategies without real money
- **Educational**: Help users learn, not just give signals

The AI analysis should:
- **Empower**: Give users the tools to make informed decisions
- **Educate**: Explain the reasoning, don't just give answers
- **Protect**: Emphasize risk management and uncertainty
- **Inspire**: Help users develop their own trading edge

---

## Success Criteria

Your research will be considered successful if it:
1. Provides 50+ production-ready prompt templates
2. Covers all 7 analytical categories comprehensively
3. Includes 5+ complete end-to-end workflows
4. Offers concrete code examples and data structures
5. Addresses both beginner and advanced use cases
6. Balances technical depth with practical usability
7. Establishes clear quality metrics and validation methods

Take your time. Be thorough. Think like a professional trader, a data scientist, and a prompt engineer simultaneously. The goal is to create the definitive guide for AI-powered trading analysis prompts.

Begin your research now.
