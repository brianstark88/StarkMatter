# StarkMatter AI Prompt Engineering System - Implementation Plan

> Based on: "StarkMatter AI Prompt Engineering Research Guide.docx"

## Executive Summary

This plan implements a comprehensive AI-powered trading analysis system for StarkMatter, featuring:
- **19+ prompt templates** across 7 analysis categories
- **3 automated workflows** for daily briefings, trade development, and portfolio rebalancing
- **Hybrid execution mode** supporting both Claude API and manual Claude Code usage
- **Rich frontend interface** with integration into TradingViewPro

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.2 | 2026-01-07 | Added: few-shot examples, data summarization, case studies, quick-start wizard, workflow conditionals, prompt inventory, chain-of-thought |
| 1.1 | 2026-01-06 | Added critical review improvements: testing, security, error handling, MVP prioritization, example prompt content |
| 1.0 | 2026-01-06 | Initial plan based on AI Prompt Engineering Research Guide |

---

## Table of Contents

1. [Document Requirements](#document-requirements)
2. [Architecture Overview](#architecture-overview)
3. [Prompt Template Library](#prompt-template-library)
4. [Prompt Template Schema](#prompt-template-schema) **(NEW v1.2)**
5. [Few-Shot Examples](#few-shot-examples) **(NEW v1.2)**
6. [Data Summarization Strategies](#data-summarization-strategies) **(NEW v1.2)**
7. [Workflow Definitions](#workflow-definitions)
8. [Workflow Conditional Logic](#workflow-conditional-logic) **(NEW v1.2)**
9. [Backend Implementation](#backend-implementation)
10. [Frontend Implementation](#frontend-implementation)
11. [Database Schema](#database-schema)
12. [Case Studies Integration](#case-studies-integration) **(NEW v1.2)**
13. [Hybrid Execution Mode](#hybrid-execution-mode)
14. [Prompt Inventory Checklist](#prompt-inventory-checklist) **(NEW v1.2)**
15. [Implementation Phases](#implementation-phases)
16. [Critical Files](#critical-files)
17. [Improvements from Critical Review](#improvements-from-critical-review)
18. [Updated Implementation Phases](#updated-implementation-phases-revised)
19. [Chain-of-Thought & Educational Integration](#chain-of-thought--educational-integration) **(NEW v1.2)**

---

## Document Requirements

### Section Summary

| Section | Content |
|---------|---------|
| **Section 1** | Executive summary, top 10 prompt patterns, quick-start guide |
| **Section 2** | 19+ prompt templates across 7 categories |
| **Section 3** | 3 workflows: Daily Analysis, Trade Development, Portfolio Rebalancing |
| **Section 4** | Technical implementation: prompt construction, data injection, caching |
| **Section 5** | Evaluation framework: quality metrics, backtesting, user feedback |
| **Section 6** | Advanced topics: RAG/embeddings, fine-tuning, multi-modal (future) |
| **Section 7** | Case studies demonstrating real-world usage |

### Key Design Principles (from Document)

1. **Holistic Prompt Design**: Integrate technical, fundamental, and sentiment data
2. **Structured Outputs**: Demand clear entry/exit rules, timeframes, rationale
3. **Contextual Data Injection**: All data must be provided in prompts (local-first)
4. **Few-Shot Examples**: Include examples for better accuracy
5. **Expert Personas**: Assign domain-specific roles ("veteran portfolio manager")
6. **Risk & Uncertainty**: Always include confidence levels and disclaimers
7. **Continuous Validation**: Backtest signals and refine prompts

---

## Architecture Overview

### New Backend Structure

```
api/
├── routers/
│   └── ai_analysis.py              # AI API endpoints
├── services/
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── prompt_manager.py       # Template loading/rendering (Jinja2)
│   │   ├── data_formatter.py       # Format DB data for prompts
│   │   ├── workflow_engine.py      # Multi-step orchestration
│   │   ├── response_parser.py      # Parse AI responses
│   │   ├── cache_manager.py        # Response caching (15min TTL)
│   │   └── evaluation.py           # Quality metrics & logging
│   └── claude_client.py            # Claude API wrapper (optional)
├── prompts/                        # YAML prompt templates
│   ├── technical/                  # 3 templates
│   ├── fundamental/                # 3 templates
│   ├── sentiment/                  # 3 templates
│   ├── signals/                    # 3 templates
│   ├── portfolio/                  # 3 templates
│   ├── regime/                     # 1 template
│   ├── educational/                # 3+ templates
│   └── workflows/                  # 3 workflow definitions
└── models/
    └── ai_models.py                # Pydantic request/response models
```

### New Frontend Structure

```
ui/src/
├── pages/
│   └── AIInsights.tsx              # FULL REWRITE (currently 8 lines)
├── components/ai/
│   ├── QuickAnalysis.tsx           # One-click analysis cards
│   ├── PromptLibrary.tsx           # Browse/select templates
│   ├── AnalysisPanel.tsx           # Display analysis results
│   ├── WorkflowRunner.tsx          # Execute multi-step workflows
│   ├── ChatInterface.tsx           # Interactive AI chat
│   ├── AnalysisHistory.tsx         # Past analyses browser
│   ├── InsightCard.tsx             # Individual insight display
│   ├── PromptExport.tsx            # Manual mode: copy prompt
│   ├── ResponseImport.tsx          # Manual mode: paste response
│   ├── QuickAIPanel.tsx            # TradingViewPro integration
│   ├── FeedbackModal.tsx           # Rate analysis quality
│   ├── OnboardingWizard.tsx        # First-time user quick-start (NEW v1.2)
│   ├── CaseStudyViewer.tsx         # Browse case studies (NEW v1.2)
│   └── GlossaryTooltip.tsx         # Educational tooltips (NEW v1.2)
├── hooks/
│   └── useAIAnalysis.ts            # AI API custom hooks
├── types/
│   └── ai.ts                       # AI TypeScript interfaces
└── lib/
    └── aiApi.ts                    # AI-specific API client
```

---

## Prompt Template Library

### Category 1: Technical Analysis (2.1)

| Template | File | Description |
|----------|------|-------------|
| **Comprehensive Chart Analysis** | `technical/chart_analysis.yaml` | Full technical analysis: trend, patterns, S/R levels, indicators, candlesticks, confidence scores |
| **Indicator Signal Check** | `technical/indicator_signal.yaml` | Focused analysis of specific indicators (RSI, MACD, Bollinger) and their confluence |
| **Multi-Timeframe Alignment** | `technical/multi_timeframe.yaml` | Compare weekly/daily/intraday trends for alignment |

### Category 2: Fundamental Analysis (2.2)

| Template | File | Description |
|----------|------|-------------|
| **Comprehensive Stock Evaluation** | `fundamental/stock_evaluation.yaml` | Full equity research: business model, financials, valuation, growth, risks, recommendation |
| **Quick Ratio Comparison** | `fundamental/ratio_comparison.yaml` | Compare P/E, P/B, growth vs peers and industry |
| **Economic Indicator Correlation** | `fundamental/economic_correlation.yaml` | How macro trends (GDP, inflation, rates) impact the stock |

### Category 3: Sentiment Analysis (2.3)

| Template | File | Description |
|----------|------|-------------|
| **News Sentiment Summary** | `sentiment/news_sentiment.yaml` | Analyze news headlines, extract themes, score sentiment |
| **Social Media Sentiment** | `sentiment/social_sentiment.yaml` | Reddit/Twitter sentiment analysis, crowd narratives, contrarian signals |
| **Sentiment Shift Detection** | `sentiment/sentiment_shift.yaml` | Compare past vs current sentiment, identify triggers |

### Category 4: Trade Signal Generation (2.4)

| Template | File | Description |
|----------|------|-------------|
| **Multi-Factor Trade Idea** | `signals/multi_factor_trade.yaml` | Generate trade with entry/stop/target from technical + fundamental + sentiment |
| **Risk-Reward & Position Sizing** | `signals/risk_reward.yaml` | Calculate R:R ratio, position size based on account risk |
| **Scenario Planning** | `signals/scenario_planning.yaml` | Bull case vs bear case with triggers and action plans |

### Category 5: Portfolio & Risk Management (2.5)

| Template | File | Description |
|----------|------|-------------|
| **Portfolio Diversification Check** | `portfolio/diversification.yaml` | Analyze sector concentration, single-stock risk, diversification gaps |
| **Risk Metric Analysis** | `portfolio/var_analysis.yaml` | Evaluate Sharpe, drawdown, VaR, volatility vs goals |
| **Performance Attribution** | `portfolio/performance_attribution.yaml` | Which holdings drove returns, rebalancing suggestions |

### Category 6: Market Regime Detection (2.6)

| Template | File | Description |
|----------|------|-------------|
| **Market Regime Classification** | `regime/regime_detection.yaml` | Identify bull/bear, high/low vol, risk-on/off regime |

### Category 7: Educational (2.7)

| Template | File | Description |
|----------|------|-------------|
| **Concept Explainer** | `educational/concept_explainer.yaml` | Explain technical/fundamental concepts in simple terms |
| **Strategy Guide** | `educational/strategy_guide.yaml` | Explain trading strategies with examples |
| **Risk Education** | `educational/risk_education.yaml` | Explain risk concepts, position sizing, drawdowns |

---

## Prompt Template Schema

### Enhanced YAML Structure (v1.2)

All prompt templates follow this enhanced schema with few-shot examples and chain-of-thought support:

```yaml
# Full Template Schema
name: template_name                    # Unique identifier
category: technical|fundamental|sentiment|signals|portfolio|regime|educational
version: "1.0.0"                       # Semantic versioning
description: "Brief description"

# Metadata for execution
metadata:
  temperature: 0.2                     # 0.0-1.0 (lower = deterministic)
  max_tokens: 2048                     # Maximum response length
  estimated_cost: "$0.02"              # Approximate API cost
  recommended_use_cases:               # When to use this template
    - "daily screening"
    - "deep dive analysis"
  typical_runtime: "10-15 seconds"     # Expected execution time
  data_freshness_required: "daily"     # intraday|daily|weekly
  skill_level: "intermediate"          # beginner|intermediate|advanced
  requires_chain_of_thought: true      # Enable step-by-step reasoning

# Placeholders for data injection
placeholders:
  - name: symbol
    type: string
    required: true
    example: "AAPL"
    validation: "^[A-Z]{1,5}$"         # Regex validation
  - name: timeframe
    type: string
    required: false
    default: "daily"
    options: ["1h", "4h", "daily", "weekly"]
  - name: price_data
    type: data
    source: market_data                # DataFormatter method to call
    days: 30                           # Parameters for data source
    token_budget: 500                  # Max tokens for this data
  - name: indicators
    type: data
    source: technical_indicators
    token_budget: 300

# Few-shot examples (NEW in v1.2)
few_shot_examples:
  - description: "Bullish breakout example"
    input:
      symbol: "MSFT"
      price_summary: "MSFT rose from $380 to $420 (+10.5%) over 3 weeks..."
      indicators: "RSI: 62, MACD: bullish crossover 5 days ago..."
    output: |
      ## Technical Analysis: MSFT (Daily)

      ### 1. Trend Analysis
      - **Primary Trend**: Bullish (strong)
      - Price is making higher highs and higher lows
      - Trading above all major moving averages (20/50/200 SMA)

      ### 2. Support & Resistance
      - **Support**: $400 (recent breakout level), $380 (prior consolidation)
      - **Resistance**: $430 (measured move target), $450 (psychological)

      ### 5. Trade Setup
      - Direction: BUY
      - Entry: $418 (pullback to breakout retest)
      - Stop Loss: $395 (below breakout level)
      - Take Profit: $445 (1.5x ATR extension)
      - Risk/Reward: 1:2.2

      ### 6. Confidence: HIGH
      Breakout on volume with momentum confirmation.

  - description: "Bearish divergence example"
    input:
      symbol: "META"
      price_summary: "META made new high at $550 but RSI peaked lower..."
    output: |
      ## Technical Analysis: META (Daily)

      ### 1. Trend Analysis
      - **Primary Trend**: Bullish but weakening
      - Bearish RSI divergence detected (price higher high, RSI lower high)
      ...

# Chain-of-thought instructions (NEW in v1.2)
chain_of_thought:
  enabled: true
  reasoning_steps:
    - "First, identify the primary trend direction from price structure"
    - "Second, locate key support and resistance levels"
    - "Third, analyze indicator confluence"
    - "Fourth, check for confirming or diverging signals"
    - "Finally, synthesize findings into actionable trade setup"

# System and user prompts
system_prompt: |
  You are a professional technical analyst with 15 years of experience...

  IMPORTANT: This is for educational purposes only. Not financial advice.

  When analyzing, follow these steps:
  {% for step in chain_of_thought.reasoning_steps %}
  {{ loop.index }}. {{ step }}
  {% endfor %}

user_prompt: |
  Analyze the technical setup for **{{ symbol }}** on the {{ timeframe }} timeframe.

  {% if few_shot_examples %}
  ## Example Analysis
  Here's an example of the expected output format:
  {{ few_shot_examples[0].output }}

  ---
  Now analyze this data:
  {% endif %}

  ## Recent Price Action
  {{ price_data }}

  ## Current Technical Indicators
  {{ indicators }}

  Please provide your analysis following the same format as the example above.

# Output format specification
output_format:
  type: markdown                       # markdown|json|structured
  required_sections:
    - "Trend Analysis"
    - "Support & Resistance"
    - "Technical Indicators"
    - "Trade Setup"
    - "Confidence & Risks"
  structured_fields:                   # For parsing
    - path: "trade_setup.direction"
      type: "enum"
      values: ["BUY", "SELL", "HOLD"]
    - path: "trade_setup.entry"
      type: "price"
    - path: "confidence"
      type: "enum"
      values: ["HIGH", "MEDIUM", "LOW"]
```

---

## Few-Shot Examples

### Purpose

Few-shot examples are critical for consistent, high-quality AI outputs. The research guide emphasizes including 1-2 sample input/outputs to:
- Demonstrate exact output format expected
- Reduce hallucinations and inconsistencies
- Guide the AI's reasoning pattern
- Improve accuracy on complex financial tasks

### Implementation in PromptManager

```python
# api/services/ai/prompt_manager.py

class PromptManager:
    def render_template(self, template: PromptTemplate, data: Dict) -> str:
        """Render template with data and few-shot examples."""

        # Select appropriate few-shot example based on context
        example = self._select_few_shot_example(template, data)

        # Inject example into prompt context
        context = {
            **data,
            "few_shot_example": example,
            "chain_of_thought": template.chain_of_thought
        }

        # Render with Jinja2
        rendered = self.jinja_env.from_string(template.user_prompt).render(context)
        return rendered

    def _select_few_shot_example(
        self,
        template: PromptTemplate,
        data: Dict
    ) -> Optional[FewShotExample]:
        """Select most relevant example based on data characteristics."""

        if not template.few_shot_examples:
            return None

        # For technical analysis, match on market condition
        if template.category == "technical":
            indicators = data.get("indicators", {})

            # If RSI oversold, prefer oversold example
            if indicators.get("rsi", 50) < 30:
                return self._find_example_by_tag(template, "oversold")

            # If recent breakout, prefer breakout example
            if self._detect_breakout(data):
                return self._find_example_by_tag(template, "breakout")

        # Default: return first example
        return template.few_shot_examples[0]
```

### Example Categories per Template Type

| Template Category | Example Types to Include |
|-------------------|-------------------------|
| **Technical** | Bullish breakout, Bearish reversal, Range-bound, Divergence |
| **Fundamental** | Undervalued growth, Overvalued mature, Turnaround story |
| **Sentiment** | Positive momentum, Negative shift, Mixed signals |
| **Trade Signals** | Long setup, Short setup, No-trade scenario |
| **Portfolio** | Well-diversified, Concentrated risk, Rebalance needed |

---

## Data Summarization Strategies

### Purpose

The research guide emphasizes that all data must be provided in prompts (local-first, no internet). To avoid token limits and hallucinations, data must be **pre-summarized and prioritized**.

### Token Budget Allocation

Each template has a total token budget (typically 2000-4000 tokens). Data must be compressed to fit:

```python
# Default token budgets per data type
TOKEN_BUDGETS = {
    "price_data": 500,        # ~60 days summarized
    "indicators": 300,        # Key technical indicators
    "news_summary": 400,      # 5-10 headlines with dates
    "reddit_sentiment": 200,  # Aggregated scores + top posts
    "fundamentals": 400,      # Key ratios and metrics
    "portfolio": 300,         # Holdings with weights
    "economic": 200,          # Key macro indicators
}

# Reserve tokens for prompt structure and response
PROMPT_OVERHEAD = 800
RESPONSE_RESERVE = 2000
```

### DataFormatter Compression Methods

```python
# api/services/ai/data_formatter.py

class DataFormatter:

    def format_market_data(
        self,
        symbol: str,
        days: int = 30,
        token_budget: int = 500
    ) -> str:
        """Format OHLCV data within token budget."""

        # Get raw data
        ohlcv = self.market_service.get_ohlcv(symbol, days)

        # Strategy 1: Statistical summary (most compact)
        if token_budget < 200:
            return self._statistical_summary(ohlcv)

        # Strategy 2: Key points only (start, end, highs, lows)
        if token_budget < 400:
            return self._key_points_summary(ohlcv)

        # Strategy 3: Weekly aggregation
        if token_budget < 600:
            return self._weekly_aggregation(ohlcv)

        # Strategy 4: Full daily with compression
        return self._compressed_daily(ohlcv, token_budget)

    def _statistical_summary(self, ohlcv: List[OHLCV]) -> str:
        """Ultra-compact statistical summary (~100 tokens)."""
        start_price = ohlcv[0].close
        end_price = ohlcv[-1].close
        high = max(o.high for o in ohlcv)
        low = min(o.low for o in ohlcv)
        avg_volume = sum(o.volume for o in ohlcv) / len(ohlcv)
        change_pct = ((end_price - start_price) / start_price) * 100

        return f"""**{len(ohlcv)}-Day Summary:**
- Period: {ohlcv[0].date} to {ohlcv[-1].date}
- Change: {start_price:.2f} → {end_price:.2f} ({change_pct:+.1f}%)
- Range: {low:.2f} (low) to {high:.2f} (high)
- Avg Volume: {avg_volume:,.0f}
- Trend: {"Uptrend" if change_pct > 5 else "Downtrend" if change_pct < -5 else "Sideways"}"""

    def _key_points_summary(self, ohlcv: List[OHLCV]) -> str:
        """Key inflection points (~250 tokens)."""
        # Find local highs and lows
        pivots = self._find_pivot_points(ohlcv)

        lines = ["**Key Price Levels:**"]
        for pivot in pivots[:5]:  # Top 5 pivots
            lines.append(f"- {pivot.date}: ${pivot.price:.2f} ({pivot.type})")

        # Add current position
        current = ohlcv[-1]
        lines.append(f"\n**Current:** ${current.close:.2f} (as of {current.date})")

        # Add trend summary
        lines.append(f"\n**Recent Action:** {self._describe_recent_action(ohlcv[-10:])}")

        return "\n".join(lines)

    def _weekly_aggregation(self, ohlcv: List[OHLCV]) -> str:
        """Weekly OHLCV bars (~400 tokens)."""
        weekly = self._aggregate_to_weekly(ohlcv)

        lines = ["**Weekly Price Data:**"]
        lines.append("| Week | Open | High | Low | Close | Change |")
        lines.append("|------|------|------|-----|-------|--------|")

        for week in weekly:
            change = ((week.close - week.open) / week.open) * 100
            lines.append(
                f"| {week.date} | {week.open:.2f} | {week.high:.2f} | "
                f"{week.low:.2f} | {week.close:.2f} | {change:+.1f}% |"
            )

        return "\n".join(lines)

    def format_technical_indicators(
        self,
        symbol: str,
        token_budget: int = 300
    ) -> str:
        """Format technical indicators with interpretation."""

        indicators = self.technical_service.get_current_indicators(symbol)

        lines = ["**Technical Indicators:**"]

        # RSI with interpretation
        rsi = indicators.get("rsi")
        rsi_status = "OVERSOLD" if rsi < 30 else "OVERBOUGHT" if rsi > 70 else "neutral"
        lines.append(f"- RSI(14): {rsi:.1f} ({rsi_status})")

        # MACD with crossover detection
        macd = indicators.get("macd", {})
        macd_signal = "bullish crossover" if macd.get("histogram", 0) > 0 else "bearish"
        lines.append(f"- MACD: {macd.get('value', 0):.2f} ({macd_signal})")

        # Moving averages with price position
        price = indicators.get("current_price", 0)
        sma_20 = indicators.get("sma_20", 0)
        sma_50 = indicators.get("sma_50", 0)
        sma_200 = indicators.get("sma_200", 0)

        lines.append(f"- SMA(20): ${sma_20:.2f} (price {'above' if price > sma_20 else 'below'})")
        lines.append(f"- SMA(50): ${sma_50:.2f} (price {'above' if price > sma_50 else 'below'})")
        lines.append(f"- SMA(200): ${sma_200:.2f} (price {'above' if price > sma_200 else 'below'})")

        # Bollinger Bands
        bb = indicators.get("bollinger", {})
        bb_position = self._describe_bb_position(price, bb)
        lines.append(f"- Bollinger Bands: {bb_position}")

        # Volume analysis
        vol_ratio = indicators.get("volume_ratio", 1.0)
        lines.append(f"- Volume: {vol_ratio:.1f}x average ({'high' if vol_ratio > 1.5 else 'low' if vol_ratio < 0.7 else 'normal'})")

        return "\n".join(lines)

    def format_news_summary(
        self,
        symbol: str,
        limit: int = 10,
        token_budget: int = 400
    ) -> str:
        """Format news with sentiment scores."""

        news = self.news_service.get_recent_news(symbol, limit)

        if not news:
            return "**News:** No recent news available for this symbol."

        lines = ["**Recent News Headlines:**"]

        for article in news:
            # Truncate headline if needed
            headline = article.title[:80] + "..." if len(article.title) > 80 else article.title
            sentiment = article.sentiment_score or 0
            sentiment_label = "+" if sentiment > 0.2 else "-" if sentiment < -0.2 else "~"

            lines.append(f"- [{sentiment_label}] {article.date}: {headline}")

        # Aggregate sentiment
        avg_sentiment = sum(a.sentiment_score or 0 for a in news) / len(news)
        sentiment_summary = "BULLISH" if avg_sentiment > 0.3 else "BEARISH" if avg_sentiment < -0.3 else "NEUTRAL"

        lines.append(f"\n**Overall Sentiment:** {sentiment_summary} (score: {avg_sentiment:.2f})")

        return "\n".join(lines)
```

### Data Priority Rules

When token budget is tight, prioritize data in this order:

1. **Most recent price action** (last 5-10 days) - Always include
2. **Key technical indicators** (RSI, MACD, MAs) - Always include
3. **Support/resistance levels** - Include if technical analysis
4. **News headlines** - Include if sentiment analysis
5. **Fundamental metrics** - Include if fundamental analysis
6. **Historical context** - Include only if budget allows

---

## Workflow Definitions

### Workflow 1: Daily Market Analysis (3.1)

```yaml
name: daily_market_analysis
description: "Morning briefing with actionable insights"
steps:
  1. news_scan:        # Overnight news sentiment
  2. technical_check:  # Key levels and signals
  3. regime_detection: # Current market regime
  4. trade_ideas:      # 1-2 high-conviction setups
  5. portfolio_check:  # Holdings needing attention
```

### Workflow 2: Trade Idea Development (3.2)

```yaml
name: trade_idea_development
description: "From scan to fully-vetted trade plan"
steps:
  1. market_scan:      # Find candidates (breakouts, oversold)
  2. deep_dive:        # Technical + fundamental analysis
  3. sentiment_check:  # News/social sentiment
  4. trade_structure:  # Entry/stop/target
  5. risk_assessment:  # R:R and position size
  6. scenario_plan:    # Bull/bear contingencies
```

### Workflow 3: Portfolio Rebalancing (3.3)

```yaml
name: portfolio_rebalancing
description: "Periodic portfolio review and adjustment"
steps:
  1. performance_summary: # Returns vs benchmark
  2. attribution:         # What drove performance
  3. risk_check:          # Concentration, drawdown
  4. rebalance_plan:      # Specific buy/sell actions
  5. execution_guide:     # Trade instructions
```

---

## Workflow Conditional Logic

### Purpose

Workflows are not simple linear sequences. The research guide describes workflows with **conditional branching** based on AI analysis outputs. For example:
- If daily analysis finds no bullish signals → skip trade idea generation
- If portfolio risk is acceptable → skip rebalancing recommendations
- If sentiment is mixed → request additional data before proceeding

### Workflow YAML Schema with Conditionals

```yaml
# workflows/trade_development.yaml
name: trade_idea_development
description: "From scan to fully-vetted trade plan"
version: "1.0.0"

# Input parameters
inputs:
  - name: symbol
    type: string
    required: true
  - name: direction_bias
    type: string
    required: false
    options: ["long", "short", "neutral"]

# Workflow steps with conditions
steps:
  - id: market_scan
    template: technical/chart_analysis
    inputs:
      symbol: "{{ inputs.symbol }}"
    outputs:
      - trend_direction
      - trend_strength
      - confidence

  - id: check_trend_quality
    type: condition
    expression: "steps.market_scan.outputs.confidence in ['HIGH', 'MEDIUM']"
    on_true: deep_dive
    on_false: no_trade_exit

  - id: deep_dive
    template: fundamental/stock_evaluation
    inputs:
      symbol: "{{ inputs.symbol }}"
    outputs:
      - recommendation
      - valuation_status

  - id: sentiment_check
    template: sentiment/news_sentiment
    inputs:
      symbol: "{{ inputs.symbol }}"
    outputs:
      - overall_sentiment
      - sentiment_score

  - id: alignment_check
    type: condition
    expression: |
      (steps.market_scan.outputs.trend_direction == 'bullish' and
       steps.sentiment_check.outputs.overall_sentiment != 'BEARISH') or
      (steps.market_scan.outputs.trend_direction == 'bearish' and
       steps.sentiment_check.outputs.overall_sentiment != 'BULLISH')
    on_true: trade_structure
    on_false: conflicting_signals_exit

  - id: trade_structure
    template: signals/multi_factor_trade
    inputs:
      symbol: "{{ inputs.symbol }}"
      technical_summary: "{{ steps.market_scan.outputs }}"
      fundamental_summary: "{{ steps.deep_dive.outputs }}"
      sentiment_summary: "{{ steps.sentiment_check.outputs }}"
    outputs:
      - direction
      - entry_price
      - stop_loss
      - take_profit

  - id: risk_assessment
    template: signals/risk_reward
    inputs:
      trade: "{{ steps.trade_structure.outputs }}"
      account_size: "{{ context.portfolio.total_value }}"
    outputs:
      - risk_reward_ratio
      - position_size
      - max_loss

  - id: final_validation
    type: condition
    expression: "steps.risk_assessment.outputs.risk_reward_ratio >= 2.0"
    on_true: scenario_plan
    on_false: poor_rr_exit

  - id: scenario_plan
    template: signals/scenario_planning
    inputs:
      trade: "{{ steps.trade_structure.outputs }}"
    outputs:
      - bull_case
      - bear_case
      - action_triggers

  # Exit nodes
  - id: no_trade_exit
    type: exit
    status: "no_trade"
    message: "Technical setup confidence too low to proceed"
    outputs:
      reason: "low_confidence"

  - id: conflicting_signals_exit
    type: exit
    status: "no_trade"
    message: "Technical and sentiment signals conflict"
    outputs:
      reason: "signal_conflict"
      technical: "{{ steps.market_scan.outputs.trend_direction }}"
      sentiment: "{{ steps.sentiment_check.outputs.overall_sentiment }}"

  - id: poor_rr_exit
    type: exit
    status: "no_trade"
    message: "Risk/reward ratio below threshold (2.0)"
    outputs:
      reason: "poor_risk_reward"
      actual_rr: "{{ steps.risk_assessment.outputs.risk_reward_ratio }}"

# Final output aggregation
final_output:
  template: |
    ## Trade Idea: {{ inputs.symbol }}

    ### Summary
    - Direction: {{ steps.trade_structure.outputs.direction }}
    - Confidence: {{ steps.market_scan.outputs.confidence }}

    ### Trade Setup
    - Entry: ${{ steps.trade_structure.outputs.entry_price }}
    - Stop Loss: ${{ steps.trade_structure.outputs.stop_loss }}
    - Take Profit: ${{ steps.trade_structure.outputs.take_profit }}
    - R:R Ratio: {{ steps.risk_assessment.outputs.risk_reward_ratio }}

    ### Position Sizing
    - Recommended Size: {{ steps.risk_assessment.outputs.position_size }} shares
    - Max Loss: ${{ steps.risk_assessment.outputs.max_loss }}

    ### Scenarios
    **Bull Case:** {{ steps.scenario_plan.outputs.bull_case }}
    **Bear Case:** {{ steps.scenario_plan.outputs.bear_case }}
```

### WorkflowEngine Implementation

```python
# api/services/ai/workflow_engine.py

from typing import Dict, Any, Optional
from enum import Enum

class StepType(Enum):
    TEMPLATE = "template"      # Execute a prompt template
    CONDITION = "condition"    # Evaluate a condition
    EXIT = "exit"              # End workflow early

class WorkflowEngine:
    def __init__(self, prompt_manager: PromptManager, ai_client: AIClient):
        self.prompt_manager = prompt_manager
        self.ai_client = ai_client
        self.expression_evaluator = ExpressionEvaluator()

    async def execute_workflow(
        self,
        workflow_name: str,
        inputs: Dict[str, Any],
        context: Dict[str, Any] = None
    ) -> WorkflowResult:
        """Execute workflow with conditional branching."""

        workflow = self.load_workflow(workflow_name)
        state = WorkflowState(
            inputs=inputs,
            context=context or {},
            steps={},
            current_step=workflow.steps[0].id,
            status="running"
        )

        while state.status == "running":
            step = self._get_step(workflow, state.current_step)

            if step.type == StepType.TEMPLATE:
                result = await self._execute_template_step(step, state)
                state.steps[step.id] = result
                state.current_step = self._get_next_step(workflow, step)

            elif step.type == StepType.CONDITION:
                condition_result = self._evaluate_condition(step, state)
                state.current_step = step.on_true if condition_result else step.on_false

            elif step.type == StepType.EXIT:
                state.status = step.status
                state.exit_message = step.message
                state.final_outputs = self._resolve_outputs(step.outputs, state)
                break

            # Update progress
            state.progress = self._calculate_progress(workflow, state)
            await self._emit_progress(workflow.id, state)

        # Generate final output if completed successfully
        if state.status == "completed" and workflow.final_output:
            state.final_result = self._render_final_output(workflow.final_output, state)

        return WorkflowResult(
            workflow_id=workflow.id,
            status=state.status,
            steps=state.steps,
            final_result=state.final_result,
            exit_message=state.exit_message
        )

    def _evaluate_condition(self, step: WorkflowStep, state: WorkflowState) -> bool:
        """Evaluate conditional expression against workflow state."""
        return self.expression_evaluator.evaluate(
            expression=step.expression,
            context={
                "inputs": state.inputs,
                "steps": state.steps,
                "context": state.context
            }
        )

    async def _execute_template_step(
        self,
        step: WorkflowStep,
        state: WorkflowState
    ) -> StepResult:
        """Execute a template step and extract outputs."""

        # Resolve input placeholders
        resolved_inputs = self._resolve_inputs(step.inputs, state)

        # Render and execute prompt
        prompt = self.prompt_manager.render_template(
            step.template,
            resolved_inputs
        )

        response = await self.ai_client.complete(prompt)

        # Parse outputs according to step definition
        outputs = self.prompt_manager.parse_outputs(
            response,
            step.outputs
        )

        return StepResult(
            step_id=step.id,
            prompt=prompt,
            response=response,
            outputs=outputs,
            executed_at=datetime.utcnow()
        )


class ExpressionEvaluator:
    """Safe expression evaluator for workflow conditions."""

    ALLOWED_OPERATORS = {'==', '!=', '>', '<', '>=', '<=', 'in', 'not in', 'and', 'or', 'not'}

    def evaluate(self, expression: str, context: Dict) -> bool:
        """Evaluate expression safely without exec/eval."""

        # Parse expression into AST
        ast = self._parse_expression(expression)

        # Evaluate AST against context
        return self._evaluate_ast(ast, context)

    def _resolve_path(self, path: str, context: Dict) -> Any:
        """Resolve dot-notation path like 'steps.market_scan.outputs.confidence'"""
        parts = path.split('.')
        value = context
        for part in parts:
            if isinstance(value, dict):
                value = value.get(part)
            else:
                value = getattr(value, part, None)
        return value
```

### Workflow Progress Tracking

```python
# Real-time progress updates for frontend
async def _emit_progress(self, workflow_id: str, state: WorkflowState):
    """Emit progress for real-time UI updates."""
    await self.db.execute("""
        UPDATE ai_workflows
        SET current_step = ?,
            progress = ?,
            step_results = ?
        WHERE id = ?
    """, (
        state.current_step,
        state.progress,
        json.dumps(state.steps),
        workflow_id
    ))
```

---

## Backend Implementation

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/templates` | GET | List all available templates |
| `/api/ai/templates/{category}/{name}` | GET | Get template details and placeholders |
| `/api/ai/analyze` | POST | Run analysis with specified template |
| `/api/ai/analyze/quick/{type}` | POST | One-click analysis (technical/sentiment/trade) |
| `/api/ai/render-prompt` | POST | **Manual Mode**: Render prompt with data, return text |
| `/api/ai/import-response` | POST | **Manual Mode**: Import pasted Claude response |
| `/api/ai/workflow` | POST | Execute multi-step workflow |
| `/api/ai/workflow/{id}/status` | GET | Get workflow progress |
| `/api/ai/history` | GET | Get past analyses (filterable) |
| `/api/ai/history/{id}` | GET | Get specific analysis |
| `/api/ai/feedback` | POST | Submit rating/feedback |
| `/api/ai/metrics` | GET | Quality metrics dashboard data |
| `/api/ai/chat` | POST | Interactive chat with context |
| `/api/ai/morning-briefing` | GET | Generate daily briefing |

### Core Services

#### `prompt_manager.py`
```python
class PromptManager:
    def load_template(category: str, name: str) -> PromptTemplate
    def render_template(template: str, data: Dict) -> str
    def list_templates(category: Optional[str]) -> List[TemplateInfo]
    def validate_placeholders(template: str, data: Dict) -> bool
```

#### `data_formatter.py`
```python
class DataFormatter:
    def format_market_data(symbol: str, days: int) -> str
    def format_technical_indicators(symbol: str) -> str
    def format_news_summary(symbol: str, limit: int) -> str
    def format_reddit_sentiment(symbol: str) -> str
    def format_portfolio() -> str
    def format_economic_indicators() -> str
    def prepare_analysis_context(symbol: str, includes: List[str]) -> Dict
```

#### `workflow_engine.py`
```python
class WorkflowEngine:
    async def execute_workflow(name: str, params: Dict) -> WorkflowResult
    async def daily_market_analysis(symbols: List[str]) -> Dict
    async def trade_idea_development(symbol: str) -> Dict
    async def portfolio_rebalance() -> Dict
```

#### `response_parser.py`
```python
class ResponseParser:
    def parse_technical_analysis(response: str) -> TechnicalAnalysis
    def parse_trade_signal(response: str) -> TradeSignal
    def extract_structured_data(response: str) -> Dict
    def parse_markdown_sections(response: str) -> Dict[str, str]
```

---

## Frontend Implementation

### AIInsights.tsx Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Analysis Center                               [Settings ⚙️]  │
├─────────────────────────────────────────────────────────────────┤
│  [Quick Analysis] [Prompt Library] [Workflows] [Chat] [History] │
├──────────────────────────────────┬──────────────────────────────┤
│                                  │                              │
│   ┌─────────────────────────┐    │   Recent Analyses            │
│   │ Quick Analysis Cards    │    │   ├─ AAPL Technical (2m ago) │
│   │                         │    │   ├─ Portfolio Review (1h)   │
│   │ [📊 Technical] [💭 Sent]│    │   └─ NVDA Trade Idea (3h)    │
│   │ [💡 Trade Idea] [📈 Port]│   │                              │
│   └─────────────────────────┘    │   Active Workflows           │
│                                  │   └─ Morning Briefing ██░░   │
│   Current Symbol: [AAPL ▼]       │                              │
│                                  │   Favorites ⭐                │
│   ┌─────────────────────────┐    │   ├─ Daily Analysis          │
│   │                         │    │   └─ Portfolio Check         │
│   │   Analysis Results      │    │                              │
│   │   (Rendered Markdown)   │    │                              │
│   │                         │    │                              │
│   │   [Copy] [Save] [Rate]  │    │                              │
│   └─────────────────────────┘    │                              │
│                                  │                              │
└──────────────────────────────────┴──────────────────────────────┘
```

### TradingViewPro Integration

Add "AI" button to toolbar that opens a slide-out panel:

```
┌────────────────────────────────────────────────────────────────┐
│ TradingViewPro - AAPL                      [...] [AI 🧠] [⚙️] │
├────────────────────────────────────────────┬───────────────────┤
│                                            │ AI Quick Panel    │
│                                            │                   │
│   [Chart Area]                             │ For: AAPL         │
│                                            │                   │
│                                            │ [📊 Analyze Chart]│
│                                            │ [💭 Check News]   │
│                                            │ [💡 Trade Ideas]  │
│                                            │                   │
│                                            │ ─────────────────│
│                                            │ Last Analysis:    │
│                                            │ "Bullish trend... │
│                                            │                   │
│                                            │ [Open Full AI →]  │
└────────────────────────────────────────────┴───────────────────┘
```

---

## Database Schema

### New Tables

```sql
-- AI analysis history
CREATE TABLE IF NOT EXISTS ai_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_category TEXT NOT NULL,
    template_name TEXT NOT NULL,
    symbol TEXT,
    input_data TEXT,          -- JSON of all input parameters
    rendered_prompt TEXT,     -- Full prompt that was sent
    response TEXT,            -- Raw AI response
    structured_data TEXT,     -- Parsed structured data (JSON)
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    model TEXT,
    execution_mode TEXT,      -- 'api' or 'manual'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_analyses_symbol ON ai_analyses(symbol);
CREATE INDEX idx_ai_analyses_template ON ai_analyses(template_category, template_name);
CREATE INDEX idx_ai_analyses_created ON ai_analyses(created_at DESC);

-- User feedback on analyses
CREATE TABLE IF NOT EXISTS ai_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    feedback TEXT,
    helpful BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id)
);

-- AI-generated signals for backtesting
CREATE TABLE IF NOT EXISTS ai_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL,
    symbol TEXT NOT NULL,
    signal_type TEXT NOT NULL,  -- BUY, SELL, HOLD
    confidence REAL,
    entry_price REAL,
    stop_loss REAL,
    take_profit REAL,
    risk_reward_ratio REAL,
    reasoning TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id)
);

CREATE INDEX idx_ai_signals_symbol ON ai_signals(symbol);
CREATE INDEX idx_ai_signals_created ON ai_signals(created_at DESC);

-- Signal outcomes for backtesting
CREATE TABLE IF NOT EXISTS ai_signal_outcomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    signal_id INTEGER NOT NULL,
    actual_direction TEXT,      -- UP, DOWN, FLAT
    max_favorable_excursion REAL,
    max_adverse_excursion REAL,
    exit_price REAL,
    exit_reason TEXT,           -- hit_target, hit_stop, time_exit, manual
    pnl_percent REAL,
    days_held INTEGER,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (signal_id) REFERENCES ai_signals(id)
);

-- Workflow execution tracking
CREATE TABLE IF NOT EXISTS ai_workflows (
    id TEXT PRIMARY KEY,        -- UUID
    workflow_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',  -- pending, running, completed, failed
    current_step TEXT,
    progress REAL DEFAULT 0,
    input_params TEXT,          -- JSON
    step_results TEXT,          -- JSON of completed step results
    final_result TEXT,          -- JSON
    error TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Response cache with TTL
CREATE TABLE IF NOT EXISTS ai_cache (
    cache_key TEXT PRIMARY KEY,
    template_category TEXT,
    template_name TEXT,
    symbol TEXT,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX idx_ai_cache_symbol ON ai_cache(symbol);

-- Case studies for few-shot examples (NEW v1.2)
CREATE TABLE IF NOT EXISTS ai_case_studies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,           -- technical, fundamental, sentiment, etc.
    subcategory TEXT,                 -- breakout, divergence, undervalued, etc.
    symbol TEXT,                      -- Example symbol used
    scenario_type TEXT NOT NULL,      -- bullish, bearish, neutral, mixed
    difficulty_level TEXT DEFAULT 'intermediate',  -- beginner, intermediate, advanced

    -- Case study content
    context TEXT NOT NULL,            -- Market context and setup
    input_data TEXT NOT NULL,         -- JSON: price data, indicators, news used
    analysis TEXT NOT NULL,           -- The AI analysis (ideal output)
    outcome TEXT,                     -- What actually happened (for backtesting)

    -- Metadata
    is_featured BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,    -- How often used in few-shot
    effectiveness_score REAL,         -- Based on user feedback when used
    tags TEXT,                        -- JSON array of tags
    source TEXT,                      -- "historical", "synthetic", "user_contributed"

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_case_studies_category ON ai_case_studies(category, subcategory);
CREATE INDEX idx_case_studies_scenario ON ai_case_studies(scenario_type);
CREATE INDEX idx_case_studies_featured ON ai_case_studies(is_featured);
```

---

## Case Studies Integration

### Purpose (Section 7 from Research Guide)

The research guide's Section 7 emphasizes **case studies as learning tools**. Case studies serve multiple purposes:
1. **Few-shot examples**: Used dynamically in prompts to improve AI output quality
2. **Educational content**: Help users understand analysis patterns
3. **Validation baseline**: Compare AI outputs against known good analyses
4. **Template development**: Derive new prompt templates from successful cases

### Case Study Schema

Each case study contains:
- **Context**: Market conditions, timeframe, relevant events
- **Input Data**: The exact data provided to the AI
- **Analysis**: The expected/ideal AI output
- **Outcome**: What actually happened (for retrospective learning)

### API Endpoints for Case Studies

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/case-studies` | GET | List case studies (filterable by category, scenario) |
| `/api/ai/case-studies/{id}` | GET | Get specific case study |
| `/api/ai/case-studies/for-template/{template}` | GET | Get relevant case studies for a template |
| `/api/ai/case-studies/{id}/use-as-example` | POST | Mark case study as used, increment counter |

### Integration with Few-Shot Selection

```python
# api/services/ai/case_study_service.py

class CaseStudyService:
    """Manage case studies for few-shot examples."""

    def get_relevant_case_study(
        self,
        template_category: str,
        market_condition: str,
        symbol: Optional[str] = None
    ) -> Optional[CaseStudy]:
        """Find the most relevant case study for current context."""

        # Query case studies matching criteria
        query = """
            SELECT * FROM ai_case_studies
            WHERE category = ?
            AND (scenario_type = ? OR scenario_type = 'neutral')
            ORDER BY
                CASE WHEN is_featured THEN 0 ELSE 1 END,
                effectiveness_score DESC,
                usage_count DESC
            LIMIT 1
        """

        result = self.db.fetch_one(query, (template_category, market_condition))

        if result:
            # Increment usage counter
            self.db.execute(
                "UPDATE ai_case_studies SET usage_count = usage_count + 1 WHERE id = ?",
                (result['id'],)
            )

        return CaseStudy.from_row(result) if result else None

    def format_as_few_shot(self, case_study: CaseStudy) -> str:
        """Format case study for inclusion in prompt."""
        return f"""
## Example Analysis: {case_study.symbol} ({case_study.scenario_type.title()})

**Context:** {case_study.context}

**Input Data:**
{case_study.input_data}

**Analysis:**
{case_study.analysis}

---
Now analyze the following:
"""
```

### Seeding Initial Case Studies

The system should be seeded with representative case studies from Section 7:

```python
# api/scripts/seed_case_studies.py

INITIAL_CASE_STUDIES = [
    {
        "title": "AAPL Breakout from Consolidation",
        "category": "technical",
        "subcategory": "breakout",
        "symbol": "AAPL",
        "scenario_type": "bullish",
        "context": "Apple had been consolidating between $170-180 for 6 weeks following earnings...",
        "input_data": json.dumps({
            "price_summary": "AAPL traded in $170-180 range for 6 weeks, volume declining...",
            "indicators": {"rsi": 55, "macd": "neutral", "volume_trend": "declining"}
        }),
        "analysis": """## Technical Analysis: AAPL (Daily)

### 1. Trend Analysis
- **Primary Trend**: Neutral (consolidating)
- 6-week trading range $170-180
- Volume declining suggests accumulation phase ending

### 2. Support & Resistance
- **Support**: $170 (range low, tested 3x), $165 (prior breakout level)
- **Resistance**: $180 (range high), $185 (measured move target)

### 3. Technical Indicators
- RSI: 55 (neutral, room to run in either direction)
- MACD: Flat, awaiting catalyst
- Bollinger Bands: Tight squeeze, expecting volatility expansion

### 5. Trade Setup
- Direction: BUY (on breakout confirmation)
- Entry: $181.50 (above resistance with volume)
- Stop Loss: $175 (mid-range)
- Take Profit: $195 (measured move)
- R/R: 1:2.1

### 6. Confidence: MEDIUM
Setup is valid but requires breakout confirmation.""",
        "outcome": "AAPL broke out to $195 within 3 weeks (+8.3%)",
        "is_featured": True,
        "source": "historical"
    },
    # ... more case studies
]
```

### Frontend: CaseStudyViewer Component

```typescript
// ui/src/components/ai/CaseStudyViewer.tsx

interface CaseStudy {
  id: number;
  title: string;
  category: string;
  subcategory: string;
  symbol: string;
  scenarioType: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  context: string;
  inputData: object;
  analysis: string;
  outcome?: string;
  isFeatured: boolean;
  tags: string[];
}

export function CaseStudyViewer() {
  const [filter, setFilter] = useState<CaseStudyFilter>({});
  const { data: caseStudies } = useQuery(['case-studies', filter], () =>
    aiApi.getCaseStudies(filter)
  );

  return (
    <div className="case-study-viewer">
      {/* Filter bar */}
      <div className="filters">
        <Select
          label="Category"
          options={CATEGORIES}
          onChange={(v) => setFilter({ ...filter, category: v })}
        />
        <Select
          label="Scenario"
          options={['bullish', 'bearish', 'neutral']}
          onChange={(v) => setFilter({ ...filter, scenarioType: v })}
        />
      </div>

      {/* Case study grid */}
      <div className="grid grid-cols-2 gap-4">
        {caseStudies?.map((cs) => (
          <CaseStudyCard key={cs.id} caseStudy={cs} />
        ))}
      </div>
    </div>
  );
}

function CaseStudyCard({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between">
        <h3 className="font-semibold">{caseStudy.title}</h3>
        {caseStudy.isFeatured && (
          <span className="text-yellow-500">⭐ Featured</span>
        )}
      </div>
      <div className="text-sm text-gray-500">
        {caseStudy.symbol} • {caseStudy.scenarioType} • {caseStudy.category}
      </div>
      <p className="mt-2 text-sm">{caseStudy.context.slice(0, 150)}...</p>
      {caseStudy.outcome && (
        <div className="mt-2 p-2 bg-green-50 rounded text-sm">
          <strong>Outcome:</strong> {caseStudy.outcome}
        </div>
      )}
      <button className="mt-2 text-blue-600 text-sm">
        View Full Analysis →
      </button>
    </div>
  );
}
```

---

## Hybrid Execution Mode

### Design Decision

The system supports **two execution modes** to accommodate users without API keys:

### Mode 1: Manual Mode (Default)

No API key required. User runs prompts through Claude Code CLI.

**UI Flow:**
1. User selects template and symbol
2. System renders complete prompt with all data injected
3. User clicks "Copy Prompt" (clipboard)
4. User pastes into Claude Code CLI and gets response
5. User clicks "Import Response" and pastes Claude's answer
6. System parses, stores, and displays the analysis

**Benefits:**
- Works with $20/month Claude Pro subscription
- No API costs
- Full prompt visibility for learning

### Mode 2: API Mode (When Configured)

Requires `ANTHROPIC_API_KEY` in `.env`.

**UI Flow:**
1. User selects template and symbol
2. System renders prompt and sends to Claude API
3. Response streams back in real-time
4. System parses, stores, and displays automatically

**Benefits:**
- One-click execution
- Streaming responses
- Better for frequent/automated use

### Configuration

```env
# .env additions
ANTHROPIC_API_KEY=           # Leave empty for manual mode
AI_MODEL=claude-sonnet-4-20250514
AI_MAX_TOKENS=4096
AI_CACHE_TTL_MINUTES=15
AI_MODE=manual               # "api" or "manual"
```

---

## Prompt Inventory Checklist

### Purpose

This checklist ensures all 19+ prompts from Section 2 of the research guide are implemented. Each template maps to a specific prompt from the guide.

### Section 2.1: Technical Analysis (3 templates)

| # | Research Guide Prompt | YAML File | Status | Notes |
|---|----------------------|-----------|--------|-------|
| 2.1.1 | Comprehensive Chart Analysis | `technical/chart_analysis.yaml` | ☐ | 7 tasks: trend, patterns, S/R, candlesticks, indicators, multi-TF, confidence |
| 2.1.2 | Focused Indicator Signal Check | `technical/indicator_signal.yaml` | ☐ | RSI, MACD, Bollinger confluence |
| 2.1.3 | Multi-Timeframe Trend Alignment | `technical/multi_timeframe.yaml` | ☐ | Weekly/daily/intraday alignment |

### Section 2.2: Fundamental Analysis (3 templates)

| # | Research Guide Prompt | YAML File | Status | Notes |
|---|----------------------|-----------|--------|-------|
| 2.2.1 | Comprehensive Stock Evaluation | `fundamental/stock_evaluation.yaml` | ☐ | 8 sections: exec summary, business, financials, valuation, growth, mgmt, risks, recommendation |
| 2.2.2 | Quick Ratio Comparison | `fundamental/ratio_comparison.yaml` | ☐ | P/E, P/B, growth vs peers |
| 2.2.3 | Economic Indicator Correlation | `fundamental/economic_correlation.yaml` | ☐ | GDP, inflation, rates impact |

### Section 2.3: Sentiment Analysis (3 templates)

| # | Research Guide Prompt | YAML File | Status | Notes |
|---|----------------------|-----------|--------|-------|
| 2.3.1 | News Sentiment Summary | `sentiment/news_sentiment.yaml` | ☐ | Headlines, themes, sentiment score |
| 2.3.2 | Social Media Sentiment | `sentiment/social_sentiment.yaml` | ☐ | Reddit/Twitter, contrarian signals |
| 2.3.3 | Sentiment Shift Detection | `sentiment/sentiment_shift.yaml` | ☐ | Past vs current, triggers |

### Section 2.4: Trade Signal Generation (3 templates)

| # | Research Guide Prompt | YAML File | Status | Notes |
|---|----------------------|-----------|--------|-------|
| 2.4.1 | Multi-Factor Trade Idea | `signals/multi_factor_trade.yaml` | ☐ | Technical + fundamental + sentiment |
| 2.4.2 | Risk-Reward & Position Sizing | `signals/risk_reward.yaml` | ☐ | R:R ratio, position size |
| 2.4.3 | Scenario Planning | `signals/scenario_planning.yaml` | ☐ | Bull/bear cases, action triggers |

### Section 2.5: Portfolio & Risk Management (3 templates)

| # | Research Guide Prompt | YAML File | Status | Notes |
|---|----------------------|-----------|--------|-------|
| 2.5.1 | Portfolio Diversification Check | `portfolio/diversification.yaml` | ☐ | Sector concentration, risk gaps |
| 2.5.2 | Risk Metric Analysis | `portfolio/var_analysis.yaml` | ☐ | Sharpe, VaR, drawdown vs goals |
| 2.5.3 | Performance Attribution | `portfolio/performance_attribution.yaml` | ☐ | Return drivers, rebalancing |

### Section 2.6: Market Regime Detection (1 template)

| # | Research Guide Prompt | YAML File | Status | Notes |
|---|----------------------|-----------|--------|-------|
| 2.6.1 | Market Regime Classification | `regime/regime_detection.yaml` | ☐ | Bull/bear, vol regime, risk-on/off |

### Section 2.7: Educational (3+ templates)

| # | Research Guide Prompt | YAML File | Status | Notes |
|---|----------------------|-----------|--------|-------|
| 2.7.1 | Concept Explainer | `educational/concept_explainer.yaml` | ☐ | Plain-language explanations |
| 2.7.2 | Strategy Guide | `educational/strategy_guide.yaml` | ☐ | Trading strategies with examples |
| 2.7.3 | Risk Education | `educational/risk_education.yaml` | ☐ | Position sizing, drawdowns |

### Section 3: Workflows (3 definitions)

| # | Research Guide Workflow | YAML File | Status | Notes |
|---|------------------------|-----------|--------|-------|
| 3.1 | Daily Market Analysis | `workflows/daily_analysis.yaml` | ☐ | Morning briefing, 5 steps |
| 3.2 | Trade Idea Development | `workflows/trade_development.yaml` | ☐ | Scan to trade plan, 6 steps |
| 3.3 | Portfolio Rebalancing | `workflows/portfolio_rebalance.yaml` | ☐ | Periodic review, 5 steps |

### Implementation Priority

**Phase 1 (MVP - 5 core templates):**
1. ☐ `technical/chart_analysis.yaml` - Most requested analysis type
2. ☐ `sentiment/news_sentiment.yaml` - Integrates with existing news service
3. ☐ `signals/multi_factor_trade.yaml` - Core trading functionality
4. ☐ `portfolio/diversification.yaml` - Portfolio management essential
5. ☐ `educational/concept_explainer.yaml` - User education/onboarding

**Phase 2 (Complete library - remaining 14):**
- ☐ All remaining templates from sections 2.1-2.7

**Phase 3 (Workflows):**
- ☐ All 3 workflow definitions

### Validation Checklist per Template

Before marking a template complete, verify:

- [ ] **Structure**: Follows enhanced YAML schema (v1.2)
- [ ] **Few-shot examples**: At least 2 examples included
- [ ] **Chain-of-thought**: Reasoning steps defined (if applicable)
- [ ] **Placeholders**: All data sources mapped to DataFormatter methods
- [ ] **Token budgets**: Defined for each data placeholder
- [ ] **Output format**: Required sections and structured fields defined
- [ ] **System prompt**: Expert persona, disclaimers included
- [ ] **User prompt**: Clear instructions, format guidance
- [ ] **Version**: Semantic version and changelog
- [ ] **Test coverage**: Unit test with mock response

---

## Implementation Phases

### Phase 1: Core Infrastructure
**Goal:** Basic prompt system working

- [ ] Create directory structure (`api/services/ai/`, `api/prompts/`)
- [ ] Implement `prompt_manager.py` with Jinja2 template rendering
- [ ] Implement `data_formatter.py` connecting to existing services
- [ ] Create 5 core YAML templates:
  - `technical/chart_analysis.yaml`
  - `sentiment/news_sentiment.yaml`
  - `signals/multi_factor_trade.yaml`
  - `portfolio/diversification.yaml`
  - `educational/concept_explainer.yaml`
- [ ] Add database schema (ai_analyses, ai_feedback)
- [ ] Create `ai_analysis.py` router with basic endpoints:
  - `GET /api/ai/templates`
  - `POST /api/ai/render-prompt`
  - `POST /api/ai/import-response`
- [ ] Register router in `main.py`

### Phase 2: Complete Template Library
**Goal:** All 19+ templates implemented

- [ ] Create all technical templates (3)
- [ ] Create all fundamental templates (3)
- [ ] Create all sentiment templates (3)
- [ ] Create all signal templates (3)
- [ ] Create all portfolio templates (3)
- [ ] Create regime detection template (1)
- [ ] Create educational templates (3+)
- [ ] Implement `response_parser.py` for structured extraction
- [ ] Implement `cache_manager.py` with TTL
- [ ] Add quick analysis endpoints

### Phase 3: Workflow Engine
**Goal:** Multi-step automated workflows

- [ ] Implement `workflow_engine.py`
- [ ] Create workflow YAML definitions:
  - `workflows/daily_analysis.yaml`
  - `workflows/trade_development.yaml`
  - `workflows/portfolio_rebalance.yaml`
- [ ] Add workflow endpoints
- [ ] Add workflow database table
- [ ] Implement background task handling
- [ ] Real-time progress tracking via polling

### Phase 4: Frontend - Core UI
**Goal:** Working AI Insights page

- [ ] Create `ui/src/types/ai.ts` with interfaces
- [ ] Create `ui/src/lib/aiApi.ts` API client
- [ ] Create `ui/src/hooks/useAIAnalysis.ts`
- [ ] Rewrite `AIInsights.tsx` with tab layout
- [ ] Implement `QuickAnalysis.tsx` cards
- [ ] Implement `AnalysisPanel.tsx` result display
- [ ] Implement `PromptExport.tsx` for manual mode
- [ ] Implement `ResponseImport.tsx` for manual mode

### Phase 5: Frontend - Advanced Features
**Goal:** Complete UX with all features

- [ ] Implement `PromptLibrary.tsx` template browser
- [ ] Implement `WorkflowRunner.tsx` with progress
- [ ] Implement `ChatInterface.tsx` for interactive chat
- [ ] Implement `AnalysisHistory.tsx` with search/filter
- [ ] Implement `QuickAIPanel.tsx` for TradingViewPro
- [ ] Integrate AI button into TradingViewPro.tsx
- [ ] Add loading states and streaming display
- [ ] Implement `FeedbackModal.tsx`

### Phase 6: Evaluation & Polish
**Goal:** Quality tracking and production readiness

- [ ] Implement `evaluation.py` service
- [ ] Add signal backtesting tables
- [ ] Create quality metrics dashboard
- [ ] Add feedback collection UI
- [ ] Implement Claude API client (optional mode)
- [ ] Performance optimization (caching, lazy load)
- [ ] Error handling and fallbacks
- [ ] Documentation and user guide

---

## Critical Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `api/main.py` | Modify | Import and include ai_analysis router |
| `api/schema.sql` | Modify | Add 6 new AI tables |
| `api/database.py` | Modify | Ensure schema updates applied |
| `ui/src/pages/AIInsights.tsx` | **Rewrite** | Currently 8-line placeholder |
| `ui/src/pages/TradingViewPro.tsx` | Modify | Add AI button and panel |
| `ui/src/lib/api.ts` | Modify | Export aiAPI functions |
| `ui/src/types/index.ts` | Modify | Export AI types |
| `ui/src/App.tsx` | Verify | Route already exists at /insights |
| `.env` | Modify | Add AI configuration variables |
| `requirements.txt` | Modify | Add jinja2, pyyaml, anthropic |

---

## Dependencies

### Python (add to requirements.txt)
```
jinja2>=3.1.0           # Template rendering
pyyaml>=6.0             # YAML template loading
anthropic>=0.18.0       # Claude API client (optional)
```

### JavaScript
No additional dependencies needed - existing stack (React, TypeScript, Tailwind, React Query) is sufficient.

---

## Integration with Existing Services

| Existing Service | Integration Point |
|-----------------|-------------------|
| `technical_analysis.py` | DataFormatter uses for indicator data |
| `news_aggregator.py` | DataFormatter uses for news summaries |
| `reddit_scraper.py` | DataFormatter uses for sentiment data |
| `paper_trading.py` | Signal execution from trade recommendations |
| `claude_helpers.py` | Migrate/incorporate existing export utilities |
| `portfolio.py` | DataFormatter uses for position data |
| `yahoo_import.py` | DataFormatter uses for current quotes |

---

## Success Metrics

1. **Template Coverage**: All 19+ templates implemented and tested
2. **Workflow Completion**: 3 workflows executing end-to-end
3. **Manual Mode UX**: < 30 seconds from click to copied prompt
4. **API Mode Latency**: < 10 seconds for single analysis
5. **User Feedback**: Average rating > 4.0 stars
6. **Signal Accuracy**: Track win rate on backtested signals

---

## Improvements from Critical Review

### Issue 1: No Testing Strategy
**Problem:** No mention of tests in original plan.

**Solution:** Add testing infrastructure:

```
api/tests/
├── test_prompt_manager.py      # Template loading/rendering tests
├── test_data_formatter.py      # Data formatting tests
├── test_ai_endpoints.py        # API endpoint integration tests
├── test_response_parser.py     # Response parsing tests
└── fixtures/
    ├── sample_responses.json   # Mock Claude responses for testing
    └── sample_market_data.json # Test market data
```

**Test Coverage Requirements:**
- Unit tests for all services (90%+ coverage)
- Integration tests for API endpoints
- Mock Claude responses for deterministic testing
- Add to Phase 1: `pytest`, `pytest-asyncio` dependencies

---

### Issue 2: Security Considerations
**Problem:** No input validation, prompt injection risks.

**Solutions:**

1. **Input Sanitization** in `data_formatter.py`:
```python
def sanitize_input(text: str) -> str:
    """Remove potential prompt injection patterns"""
    # Strip system/assistant markers, excessive whitespace
    # Limit text length per field
    pass
```

2. **Rate Limiting** in router:
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@router.post("/render-prompt")
@limiter.limit("30/minute")  # Prevent abuse
async def render_prompt(...):
```

3. **Response Import Validation**:
- Validate response length (max 50KB)
- Check for suspicious patterns before storing
- Sanitize before database insert

4. **API Key Security**:
- Use environment variable (never commit)
- Document secure handling in setup guide

---

### Issue 3: Error Handling
**Problem:** No strategy for missing data, malformed responses.

**Solution:** Add comprehensive error handling:

```python
class AIAnalysisError(Exception):
    """Base exception for AI analysis"""
    pass

class InsufficientDataError(AIAnalysisError):
    """Not enough market data for analysis"""
    pass

class TemplateNotFoundError(AIAnalysisError):
    """Template doesn't exist"""
    pass

class ResponseParseError(AIAnalysisError):
    """Could not parse Claude response"""
    pass
```

**Error Responses:**
```json
{
  "error": "insufficient_data",
  "message": "Symbol XYZ has only 5 days of data. Minimum 30 required for technical analysis.",
  "suggestion": "Import more historical data for this symbol first."
}
```

**Graceful Degradation:**
- If indicator missing → omit from prompt, note in output
- If response parse fails → return raw text with warning
- If symbol has no news → use "No recent news available" placeholder

---

### Issue 4: Template Versioning
**Problem:** No strategy for updating templates.

**Solution:** Add version tracking:

```yaml
# template header
name: chart_analysis
version: "1.2.0"
min_compatible_version: "1.0.0"
deprecated: false
changelog:
  - "1.2.0: Added candlestick pattern detection"
  - "1.1.0: Added confidence scores"
  - "1.0.0: Initial release"
```

**Database Change:**
```sql
ALTER TABLE ai_analyses ADD COLUMN template_version TEXT;
```

**Backward Compatibility:**
- Store template version with each analysis
- Keep old template versions in `prompts/archive/`
- Add migration guide when breaking changes occur

---

### Issue 5: Simplified Manual Mode UX
**Problem:** 6-step manual workflow is too cumbersome.

**Improved Manual Mode Flow (3 steps):**

1. **Generate**: Click button → Full prompt appears in modal with "Copy" button
2. **Execute**: Paste in Claude Code, get response
3. **Import**: Return to StarkMatter, click "Paste Response" → Done

**UI Improvements:**
- Auto-detect clipboard content on focus (optional)
- One-click "Copy & Open Instructions" button
- Inline instructions: "Paste this into Claude Code, then paste the response below"
- Preserve prompt in localStorage while user runs externally

---

### Issue 6: Robust Response Parsing
**Problem:** LLM outputs are unpredictable.

**Solution:** Multi-tier parsing strategy:

```python
class ResponseParser:
    def parse(self, response: str, template: str) -> ParsedResponse:
        # Tier 1: Try structured extraction (JSON blocks)
        if json_result := self._extract_json(response):
            return ParsedResponse(structured=json_result, raw=response)

        # Tier 2: Try markdown section parsing
        if sections := self._parse_markdown_sections(response):
            return ParsedResponse(sections=sections, raw=response)

        # Tier 3: Return raw with metadata extraction
        return ParsedResponse(
            raw=response,
            metadata=self._extract_metadata(response)  # numbers, tickers, etc.
        )
```

**Prompt Engineering for Better Parsing:**
Add to all templates:
```
Please format your response with clear markdown headers (##) for each section.
If providing trade levels, use this exact format:
- Entry: $XX.XX
- Stop Loss: $XX.XX
- Take Profit: $XX.XX
```

---

### Issue 7: Observability & Monitoring
**Problem:** No logging, health checks.

**Solution:** Add monitoring infrastructure:

```python
# api/services/ai/monitoring.py
import logging
from datetime import datetime

logger = logging.getLogger("starkmatter.ai")

class AIMetrics:
    def log_analysis(self, template: str, symbol: str, duration_ms: int, success: bool):
        logger.info(f"AI Analysis: template={template} symbol={symbol} "
                   f"duration={duration_ms}ms success={success}")

    def log_error(self, template: str, error: str, context: dict):
        logger.error(f"AI Error: template={template} error={error}", extra=context)
```

**Health Check Endpoint:**
```python
@router.get("/health")
async def ai_health():
    return {
        "status": "healthy",
        "templates_loaded": len(prompt_manager.templates),
        "cache_size": cache_manager.size(),
        "last_analysis": get_last_analysis_time()
    }
```

---

### Issue 8: MVP Prioritization
**Problem:** All features treated equally.

**MVP Definition (Phases 1-2):**

| Priority | Feature | Phase |
|----------|---------|-------|
| **P0 - Must Have** | Prompt rendering & copy | 1 |
| **P0 - Must Have** | Response import & storage | 1 |
| **P0 - Must Have** | 5 core templates | 1 |
| **P0 - Must Have** | Basic AIInsights page | 4 |
| **P1 - Should Have** | All 19 templates | 2 |
| **P1 - Should Have** | History view | 4 |
| **P1 - Should Have** | TradingViewPro button | 5 |
| **P2 - Nice to Have** | Workflows | 3 |
| **P2 - Nice to Have** | Chat interface | 5 |
| **P2 - Nice to Have** | Feedback/metrics | 6 |

**Recommended Approach:** Complete P0 first, ship, iterate.

---

### Issue 9: Example Prompt Content
**Problem:** No actual prompt text shown.

**Solution:** Include example for primary template:

```yaml
# prompts/technical/chart_analysis.yaml
name: comprehensive_chart_analysis
category: technical
version: "1.0.0"
description: "Complete technical analysis with trend, patterns, levels, and signals"

metadata:
  temperature: 0.2
  max_tokens: 2048
  estimated_cost: "$0.02"

placeholders:
  - name: symbol
    type: string
    required: true
    example: "AAPL"
  - name: timeframe
    type: string
    default: "daily"
  - name: price_data
    type: data
    source: market_data
    days: 30
  - name: indicators
    type: data
    source: technical_indicators

system_prompt: |
  You are a professional technical analyst with 15 years of experience analyzing
  equity markets. You provide precise, actionable analysis backed by data.
  You always include confidence levels and acknowledge uncertainty.

  IMPORTANT: This is for educational purposes only. Not financial advice.

user_prompt: |
  Analyze the technical setup for **{{ symbol }}** on the {{ timeframe }} timeframe.

  ## Recent Price Action (Last 30 Days)
  {{ price_data }}

  ## Current Technical Indicators
  {{ indicators }}

  Please provide a comprehensive technical analysis covering:

  ### 1. Trend Analysis
  - Primary trend direction (bullish/bearish/sideways)
  - Trend strength (strong/moderate/weak)
  - Key moving average positions

  ### 2. Support & Resistance
  - Major support levels (list 2-3 with reasoning)
  - Major resistance levels (list 2-3 with reasoning)
  - Any price clusters or high-volume nodes

  ### 3. Technical Indicators
  - RSI interpretation (overbought/oversold/neutral)
  - MACD signal (bullish/bearish crossover, divergence)
  - Bollinger Band position and squeeze status

  ### 4. Chart Patterns
  - Any recognizable patterns forming (triangles, H&S, double tops/bottoms)
  - Pattern completion percentage and invalidation level

  ### 5. Trade Setup (if applicable)
  If conditions favor a trade, provide:
  - Direction: BUY or SELL
  - Entry: $XX.XX (condition for entry)
  - Stop Loss: $XX.XX (reasoning)
  - Take Profit: $XX.XX (reasoning)
  - Risk/Reward Ratio: X:1

  ### 6. Confidence & Risks
  - Overall setup confidence: High/Medium/Low
  - Key risks or invalidation scenarios
  - What would change your view

  Note: Format numbers clearly. Use bullet points. Be specific with price levels.
```

---

## Updated Implementation Phases (Revised)

### Phase 1: MVP Core (P0)
**Goal:** Working prompt system with manual mode

- [ ] Directory structure
- [ ] `prompt_manager.py` with Jinja2
- [ ] `data_formatter.py` with sanitization
- [ ] 5 core templates with full prompt content
- [ ] Database schema (ai_analyses only initially)
- [ ] Router: `/templates`, `/render-prompt`, `/import-response`
- [ ] Basic error handling
- [ ] Unit tests for core services
- [ ] Health check endpoint

### Phase 2: Complete Templates (P1)
**Goal:** All templates + improved parsing

- [ ] Remaining 14 templates
- [ ] `response_parser.py` with multi-tier strategy
- [ ] `cache_manager.py`
- [ ] Quick analysis endpoints
- [ ] Template versioning
- [ ] Integration tests

### Phase 3: Frontend MVP (P0/P1)
**Goal:** Working UI for manual mode

- [ ] TypeScript types
- [ ] API client
- [ ] Simplified AIInsights page (not full tabs)
- [ ] `QuickAnalysis.tsx`
- [ ] `PromptExport.tsx` with improved UX
- [ ] `ResponseImport.tsx`
- [ ] `AnalysisHistory.tsx`

### Phase 4: TradingViewPro Integration (P1)
**Goal:** AI button on trading page

- [ ] `QuickAIPanel.tsx`
- [ ] TradingViewPro integration
- [ ] Context-aware symbol passing

### Phase 5: Workflows & Advanced (P2)
**Goal:** Multi-step automation

- [ ] `workflow_engine.py`
- [ ] Workflow YAML definitions
- [ ] `WorkflowRunner.tsx`
- [ ] Background task handling

### Phase 6: Polish & Metrics (P2)
**Goal:** Production quality

- [ ] `ChatInterface.tsx`
- [ ] Feedback system
- [ ] Quality metrics
- [ ] Claude API mode
- [ ] Documentation

---

## Future Enhancements (Section 6)

Reserved for future implementation:

1. **RAG/Embeddings**: Vector search for document retrieval
2. **Fine-tuning**: Custom model training on financial data
3. **Multi-modal**: Chart image analysis
4. **Reinforcement Learning**: Strategy optimization
5. **Ensemble Models**: Multiple model consensus

---

## Chain-of-Thought & Educational Integration

### Chain-of-Thought Prompting

The research guide emphasizes that **chain-of-thought (CoT) prompting greatly improves accuracy on complex tasks** by guiding the AI through stepwise reasoning.

#### When to Use Chain-of-Thought

| Analysis Type | CoT Recommended | Reasoning |
|--------------|-----------------|-----------|
| Technical Analysis | Yes | Multi-step pattern recognition |
| Trade Signal Generation | Yes | Requires weighing multiple factors |
| Portfolio Risk | Yes | Complex calculations and trade-offs |
| Fundamental Valuation | Yes | Multi-factor DCF-style reasoning |
| Sentiment Summary | Sometimes | Useful for nuanced interpretation |
| Educational/Explainer | No | Direct explanations preferred |

#### Implementation in Templates

Chain-of-thought is embedded in the template schema:

```yaml
chain_of_thought:
  enabled: true
  reasoning_steps:
    - "Step 1: Identify the primary trend from price structure (higher highs/lows)"
    - "Step 2: Locate major support and resistance levels from recent pivots"
    - "Step 3: Check technical indicator readings (RSI, MACD, Bollinger)"
    - "Step 4: Look for confluence or divergence between price and indicators"
    - "Step 5: Synthesize findings into overall market posture"
    - "Step 6: If setup is favorable, define entry/stop/target with R:R"
```

The system prompt then incorporates these steps:

```jinja2
system_prompt: |
  You are a professional technical analyst...

  **Analysis Methodology:**
  Please follow these steps when analyzing:
  {% for step in chain_of_thought.reasoning_steps %}
  {{ loop.index }}. {{ step }}
  {% endfor %}

  Show your reasoning at each step before reaching conclusions.
```

#### Benefits for StarkMatter

1. **Transparency**: Users see the AI's reasoning process
2. **Trust**: Step-by-step logic is easier to verify
3. **Education**: Users learn analytical methodology
4. **Debugging**: Easier to identify where analysis went wrong
5. **Consistency**: Same methodology applied across analyses

---

### Educational Integration

The research guide's Section 2.7 focuses on educational prompts. Beyond standalone educational templates, the system integrates education throughout.

#### GlossaryTooltip Component

Terms in AI outputs can be linked to explanations:

```typescript
// ui/src/components/ai/GlossaryTooltip.tsx

const GLOSSARY: Record<string, string> = {
  "RSI": "Relative Strength Index - A momentum indicator measuring speed and magnitude of price changes. Values above 70 suggest overbought, below 30 suggest oversold.",
  "MACD": "Moving Average Convergence Divergence - A trend-following momentum indicator showing relationship between two EMAs.",
  "Support": "A price level where buying pressure tends to prevent further decline.",
  "Resistance": "A price level where selling pressure tends to prevent further advance.",
  "Divergence": "When price and an indicator move in opposite directions, often signaling potential reversal.",
  "Breakout": "When price moves decisively above resistance or below support.",
  "R:R Ratio": "Risk-to-Reward Ratio - Compares potential loss (stop distance) to potential gain (target distance).",
  // ... 50+ more terms
};

export function GlossaryTooltip({ term }: { term: string }) {
  const definition = GLOSSARY[term];

  if (!definition) return <span>{term}</span>;

  return (
    <Tooltip content={definition}>
      <span className="underline decoration-dotted cursor-help text-blue-600">
        {term}
      </span>
    </Tooltip>
  );
}

// Automatically wrap glossary terms in analysis output
export function enrichWithGlossary(markdown: string): ReactNode {
  const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');

  return markdown.split(pattern).map((part, i) => {
    if (GLOSSARY[part]) {
      return <GlossaryTooltip key={i} term={part} />;
    }
    return part;
  });
}
```

#### OnboardingWizard Component

First-time users are guided through a quick-start flow:

```typescript
// ui/src/components/ai/OnboardingWizard.tsx

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to AI Analysis',
    content: 'StarkMatter AI helps you analyze stocks using technical, fundamental, and sentiment analysis.',
    action: 'Next'
  },
  {
    id: 'select-symbol',
    title: 'Step 1: Choose a Symbol',
    content: 'Start by selecting a stock symbol to analyze. Try AAPL or NVDA to begin.',
    interactive: true,
    component: SymbolSelector
  },
  {
    id: 'quick-analysis',
    title: 'Step 2: Run Quick Analysis',
    content: 'Click one of the Quick Analysis buttons to get instant insights.',
    highlight: ['QuickAnalysis']
  },
  {
    id: 'manual-mode',
    title: 'Step 3: Manual Mode',
    content: 'Since you\'re using Claude Pro subscription, prompts are copied to your clipboard. Paste into Claude Code to get analysis.',
    action: 'Try It'
  },
  {
    id: 'import-response',
    title: 'Step 4: Import Response',
    content: 'After getting Claude\'s response, paste it back here to save and analyze.',
    highlight: ['ResponseImport']
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    content: 'Explore the Prompt Library for more analysis types, or try a Workflow for multi-step analysis.',
    action: 'Start Analyzing'
  }
];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useLocalStorage('ai-onboarding-complete', false);

  if (completed) return null;

  const currentStep = ONBOARDING_STEPS[step];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{currentStep.title}</h2>
          <span className="text-gray-500">{step + 1}/{ONBOARDING_STEPS.length}</span>
        </div>

        <p className="text-gray-700 mb-6">{currentStep.content}</p>

        {currentStep.interactive && <currentStep.component />}

        <div className="flex justify-between">
          <button
            onClick={() => setCompleted(true)}
            className="text-gray-500"
          >
            Skip Tutorial
          </button>
          <button
            onClick={() => {
              if (step === ONBOARDING_STEPS.length - 1) {
                setCompleted(true);
              } else {
                setStep(step + 1);
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {currentStep.action || 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### "Learn More" Links in Analysis

AI outputs can include contextual learning links:

```python
# In response_parser.py or post-processing

def add_educational_links(analysis: str, template_category: str) -> str:
    """Add 'Learn more' links to key concepts in analysis."""

    # Map concepts to educational template parameters
    CONCEPT_LINKS = {
        "RSI divergence": "/insights?template=educational/concept_explainer&concept=divergence",
        "head and shoulders": "/insights?template=educational/concept_explainer&concept=head_shoulders",
        "risk-reward ratio": "/insights?template=educational/risk_education&topic=position_sizing",
    }

    for concept, link in CONCEPT_LINKS.items():
        if concept.lower() in analysis.lower():
            analysis = analysis.replace(
                concept,
                f"{concept} [Learn more]({link})"
            )

    return analysis
```

#### Difficulty Levels

Templates and case studies are tagged with difficulty levels:

| Level | Description | Example Use Cases |
|-------|-------------|-------------------|
| **Beginner** | Basic concepts, simple analyses | Concept Explainer, single-indicator checks |
| **Intermediate** | Multi-factor analysis, standard workflows | Most technical/fundamental templates |
| **Advanced** | Complex strategies, portfolio optimization | Multi-timeframe, VaR analysis, scenario planning |

The UI can filter content based on user preference:

```typescript
// User preference stored in settings
interface UserSettings {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  showAdvancedFeatures: boolean;
}

// Filter templates based on user level
function getAvailableTemplates(templates: Template[], userLevel: string) {
  const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
  return templates.filter(t =>
    levelOrder[t.difficultyLevel] <= levelOrder[userLevel]
  );
}
```

---

## Appendix: Quick Reference

### Template Schema Quick Reference

```yaml
name: string                    # Required: unique identifier
category: enum                  # Required: technical|fundamental|sentiment|signals|portfolio|regime|educational
version: "1.0.0"                # Required: semantic version
description: string             # Required: brief description

metadata:
  temperature: 0.0-1.0          # Optional: default 0.3
  max_tokens: int               # Optional: default 2048
  skill_level: enum             # Optional: beginner|intermediate|advanced

placeholders:                   # Required: list of data inputs
  - name: string
    type: string|data
    required: boolean
    source: string              # For type: data
    token_budget: int           # For type: data

few_shot_examples:              # Recommended: 1-2 examples
  - description: string
    input: object
    output: string

chain_of_thought:               # Optional
  enabled: boolean
  reasoning_steps: [string]

system_prompt: string           # Required: persona and instructions
user_prompt: string             # Required: Jinja2 template

output_format:                  # Optional: for parsing
  type: markdown|json
  required_sections: [string]
  structured_fields: [object]
```

### Database Tables Summary (v1.2)

| Table | Purpose |
|-------|---------|
| `ai_analyses` | Analysis history with prompts and responses |
| `ai_feedback` | User ratings and feedback |
| `ai_signals` | Trade signals for backtesting |
| `ai_signal_outcomes` | Signal performance tracking |
| `ai_workflows` | Workflow execution state |
| `ai_cache` | Response cache with TTL |
| `ai_case_studies` | Few-shot examples and educational cases (NEW) |

### API Endpoints Summary (v1.2)

| Category | Endpoints |
|----------|-----------|
| **Templates** | GET `/templates`, GET `/templates/{cat}/{name}` |
| **Analysis** | POST `/analyze`, POST `/render-prompt`, POST `/import-response` |
| **Quick** | POST `/analyze/quick/{type}` |
| **Workflows** | POST `/workflow`, GET `/workflow/{id}/status` |
| **History** | GET `/history`, GET `/history/{id}` |
| **Feedback** | POST `/feedback` |
| **Case Studies** | GET `/case-studies`, GET `/case-studies/{id}` (NEW) |
| **Health** | GET `/health`|
