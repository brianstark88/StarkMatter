# Claude Code Prompt Templates for Trading Analysis

## Overview
This document contains battle-tested prompt templates for analyzing market data with Claude Code. Copy and customize these prompts based on your specific trading needs.

## Table of Contents
1. [Daily Analysis Prompts](#daily-analysis-prompts)
2. [Technical Analysis Prompts](#technical-analysis-prompts)
3. [Fundamental Analysis Prompts](#fundamental-analysis-prompts)
4. [Risk Management Prompts](#risk-management-prompts)
5. [Strategy Development Prompts](#strategy-development-prompts)
6. [Market Psychology Prompts](#market-psychology-prompts)
7. [Sector & Industry Analysis](#sector--industry-analysis)
8. [Options Trading Prompts](#options-trading-prompts)
9. [Economic Analysis Prompts](#economic-analysis-prompts)
10. [Special Situations Prompts](#special-situations-prompts)

---

## Daily Analysis Prompts

### Morning Market Brief
```
Analyze this pre-market data and provide a comprehensive trading plan for today:

[PASTE MARKET DATA]

Please provide:

1. **Market Thesis** (1-2 sentences): What's the dominant theme today?

2. **Key Levels to Watch**:
   - S&P 500 support/resistance
   - VIX levels of concern
   - Dollar index impact

3. **Top 3 Long Ideas**:
   - Symbol, entry price, stop loss, target
   - Reasoning for each

4. **Top 3 Short Ideas**:
   - Symbol, entry price, stop loss, target
   - Reasoning for each

5. **Risk Factors**:
   - What could invalidate the thesis?
   - Key times to be cautious (economic releases, etc.)

6. **Sector Rotation Play**:
   - Strong sectors to focus on
   - Weak sectors to avoid or short

Format as actionable bullet points with specific price levels.
```

### End of Day Review
```
Review today's market action and my trading results:

[PASTE TODAY'S MARKET DATA AND YOUR TRADES]

Please analyze:

1. **Market Behavior**: Did it play out as expected this morning?
2. **Trade Review**: Which trades worked/failed and why?
3. **Missed Opportunities**: What did we not see coming?
4. **Lessons Learned**: Key takeaways for improvement
5. **Tomorrow's Prep**: What to watch overnight and pre-market
6. **Position Adjustments**: Any positions to close/adjust before tomorrow?

Be brutally honest about what went wrong and specific about improvements.
```

### Weekend Analysis
```
Perform a comprehensive weekly review and next week preview:

[PASTE WEEKLY DATA SUMMARY]

Analyze:

1. **Week in Review**:
   - Major market moves and catalysts
   - Best/worst performing sectors
   - Key support/resistance levels established

2. **Technical Picture**:
   - Weekly chart patterns forming
   - Key moving average positions
   - Momentum indicators status

3. **Fundamental Shifts**:
   - Economic data impact
   - Earnings themes
   - Policy changes

4. **Next Week Setup**:
   - Economic calendar highlights
   - Earnings to watch
   - Technical levels for entries

5. **Swing Trade Ideas**:
   - 3-5 positions to consider for the week
   - Specific entry/exit criteria

6. **Risk Events**:
   - What could cause volatility?
   - Hedging considerations
```

---

## Technical Analysis Prompts

### Chart Pattern Recognition
```
Analyze this price and volume data for pattern recognition:

[PASTE PRICE/VOLUME DATA]

Identify:

1. **Primary Pattern**: What's the dominant chart pattern?
2. **Pattern Reliability**: Historical success rate of this pattern
3. **Confirmation Signals**: What would confirm the pattern?
4. **Failure Points**: Where does the pattern invalidate?
5. **Price Targets**: Based on pattern measurement
6. **Volume Analysis**: Does volume support the pattern?
7. **Timeframe**: How long until pattern completes?

Provide specific entry, stop, and target levels.
```

### Multi-Timeframe Analysis
```
Analyze [SYMBOL] across multiple timeframes:

[PASTE DAILY, HOURLY, 15-MIN DATA]

Provide:

1. **Monthly/Weekly Trend**: Primary trend direction
2. **Daily Setup**: Current position within trend
3. **Intraday Opportunity**: Best entry points today
4. **Confluence Zones**: Where multiple timeframes align
5. **Risk/Reward**: Based on multi-timeframe stops/targets
6. **Optimal Strategy**: Day trade, swing, or position?
```

### Technical Indicator Convergence
```
Analyze these technical indicators for [SYMBOL]:

[PASTE INDICATOR DATA: RSI, MACD, MOVING AVERAGES, BOLLINGER BANDS, ETC.]

Determine:

1. **Indicator Agreement**: Which indicators align?
2. **Divergences**: Any concerning divergences?
3. **Overbought/Oversold**: Current status
4. **Momentum Status**: Accelerating or waning?
5. **Trading Signal**: Clear buy/sell/hold?
6. **Confidence Level**: How strong is the signal (1-10)?
```

---

## Fundamental Analysis Prompts

### Earnings Analysis
```
Analyze this earnings data for [SYMBOL]:

[PASTE EARNINGS REPORT, ESTIMATES, HISTORICAL DATA]

Evaluate:

1. **Earnings Quality**: One-time items vs. core growth
2. **Beat/Miss Analysis**: Revenue vs. EPS vs. guidance
3. **Management Commentary**: Key quotes and implications
4. **Forward Guidance**: Conservative or aggressive?
5. **Valuation Impact**: New fair value estimate
6. **Trade Setup**: How to play post-earnings move
```

### Comparative Valuation
```
Compare these companies in [SECTOR]:

[PASTE FUNDAMENTAL DATA FOR MULTIPLE COMPANIES]

Analyze:

1. **Relative Valuation**: Which is cheapest/most expensive?
2. **Growth Comparison**: Who has best growth prospects?
3. **Quality Metrics**: Margins, ROE, debt levels
4. **Competitive Position**: Market share and moats
5. **Best Investment**: Rank them 1-5 with reasoning
6. **Pair Trade**: Any long/short pair opportunities?
```

---

## Risk Management Prompts

### Portfolio Risk Assessment
```
Analyze my current portfolio for risk:

[PASTE CURRENT POSITIONS AND MARKET DATA]

Assess:

1. **Concentration Risk**: Am I too heavy in any area?
2. **Correlation Risk**: How correlated are positions?
3. **Beta Analysis**: Overall portfolio beta to market
4. **Downside Scenario**: If market drops 5%, portfolio impact?
5. **Hedge Recommendations**: Specific hedges to consider
6. **Position Sizing**: Any positions too large/small?
7. **Risk/Reward**: Overall portfolio risk/reward ratio
```

### Stop Loss Optimization
```
Help me set optimal stops for these positions:

[PASTE POSITIONS WITH ENTRY PRICES AND CURRENT PRICES]

For each position provide:

1. **Technical Stop**: Based on support levels
2. **ATR Stop**: Based on volatility
3. **Percentage Stop**: Based on risk tolerance
4. **Time Stop**: When to exit if sideways
5. **Recommended Stop**: Your overall recommendation
6. **Risk Amount**: Dollar risk with recommended stop
```

---

## Strategy Development Prompts

### Backtest Analysis
```
Analyze this historical data for strategy development:

[PASTE HISTORICAL PRICE AND INDICATOR DATA]

Test these strategies and report:

1. **Buy and Hold**: Simple benchmark return
2. **Moving Average Cross**: 20/50 day crossover results
3. **RSI Extremes**: Buy oversold, sell overbought
4. **Breakout Strategy**: Buy new highs performance
5. **Mean Reversion**: Fade extreme moves
6. **Best Performer**: Which strategy won?
7. **Optimization**: How to improve the best strategy?
```

### Strategy Refinement
```
Help me improve this trading strategy:

Current Strategy: [DESCRIBE YOUR STRATEGY]
Recent Results: [PASTE RECENT TRADE RESULTS]

Suggest:

1. **Entry Improvements**: Better entry criteria
2. **Exit Optimization**: Better profit taking
3. **Filter Addition**: What filters could improve win rate?
4. **Position Sizing**: Optimal sizing approach
5. **Market Regime Filter**: When to use/avoid strategy
6. **Risk Controls**: Additional safety measures
```

---

## Market Psychology Prompts

### Sentiment Analysis
```
Analyze this sentiment data for market psychology:

[PASTE NEWS SENTIMENT, REDDIT DATA, OPTIONS FLOW]

Interpret:

1. **Crowd Positioning**: What's the consensus?
2. **Sentiment Extremes**: Any contrarian signals?
3. **Smart vs. Dumb Money**: Divergences?
4. **Fear/Greed Level**: Where are we on the spectrum?
5. **Turning Points**: Signs of sentiment shift?
6. **Trade Ideas**: How to profit from current sentiment?
```

### Market Regime Identification
```
Identify the current market regime:

[PASTE BROAD MARKET DATA, VIX, CORRELATIONS]

Determine:

1. **Regime Type**: Trending/Range/Volatile?
2. **Risk Appetite**: Risk-on or risk-off?
3. **Leadership**: Growth vs. Value, Large vs. Small?
4. **Optimal Strategies**: What works in this regime?
5. **Regime Change Signals**: What to watch for shift?
6. **Positioning**: How to position for current regime?
```

---

## Sector & Industry Analysis

### Sector Rotation Analysis
```
Analyze sector performance for rotation opportunities:

[PASTE SECTOR PERFORMANCE DATA]

Identify:

1. **Current Leaders**: Top 3 sectors and why
2. **Laggards**: Bottom 3 sectors
3. **Momentum Shifts**: Sectors gaining/losing momentum
4. **Economic Correlation**: Why these sectors now?
5. **Rotation Trade**: Specific long/short ideas
6. **ETF Plays**: Best sector ETFs to trade
```

### Industry Comparison
```
Compare companies within [INDUSTRY]:

[PASTE COMPANY DATA FOR INDUSTRY PEERS]

Analyze:

1. **Industry Leader**: Who's best positioned?
2. **Value Play**: Any undervalued names?
3. **Growth Story**: Fastest grower?
4. **Disruption Risk**: Who's most vulnerable?
5. **Pair Trades**: Long/short combinations
6. **Industry Outlook**: 6-month view
```

---

## Options Trading Prompts

### Options Strategy Selection
```
Suggest best options strategy for this setup:

Stock: [SYMBOL]
Current Price: $[PRICE]
Outlook: [BULLISH/BEARISH/NEUTRAL]
Timeframe: [DAYS/WEEKS]
[PASTE OPTIONS CHAIN DATA]

Recommend:

1. **Strategy Choice**: Specific strategy and why
2. **Strike Selection**: Exact strikes to use
3. **Expiration**: Optimal expiration date
4. **Entry Criteria**: When to enter
5. **Risk/Reward**: Max loss vs. max gain
6. **Greeks Analysis**: Key Greeks to monitor
7. **Exit Plan**: Profit target and stop loss
```

### Implied Volatility Analysis
```
Analyze implied volatility for trading opportunity:

[PASTE CURRENT IV, HISTORICAL IV, UPCOMING EVENTS]

Determine:

1. **IV Rank/Percentile**: Current vs. historical
2. **IV Skew**: Put/call skew insights
3. **Term Structure**: Front month vs. back month
4. **Event Volatility**: Earnings/events priced in?
5. **Volatility Trade**: Best way to trade current IV
6. **Risk Assessment**: What could go wrong?
```

---

## Economic Analysis Prompts

### Economic Data Impact
```
Analyze how this economic data affects markets:

[PASTE ECONOMIC RELEASES AND FORECASTS]

Assess:

1. **Immediate Impact**: Initial market reaction
2. **Sector Winners/Losers**: Who benefits/suffers?
3. **Fed Implications**: Policy change likelihood?
4. **Currency Impact**: Dollar strength/weakness?
5. **Bond Market**: Yield curve implications?
6. **Equity Trades**: Specific stocks to trade
7. **Time Horizon**: How long will impact last?
```

### Macro Theme Development
```
Identify investable macro themes from this data:

[PASTE ECONOMIC TRENDS, POLICY CHANGES, GLOBAL DATA]

Develop:

1. **Primary Theme**: Biggest macro story
2. **Investment Thesis**: How to position
3. **Asset Classes**: Stocks, bonds, commodities, FX?
4. **Specific Trades**: Exact instruments to use
5. **Risk Factors**: What breaks the thesis?
6. **Timeline**: How long to hold positions?
```

---

## Special Situations Prompts

### Merger Arbitrage Analysis
```
Analyze this merger/acquisition opportunity:

[PASTE DEAL TERMS, STOCK PRICES, TIMELINE]

Calculate:

1. **Spread Analysis**: Current spread percentage
2. **Annualized Return**: If deal closes on time
3. **Risk Assessment**: Deal break probability
4. **Hedging**: How to hedge deal risk
5. **Comparable Deals**: Historical similar situations
6. **Trade Recommendation**: Worth the risk?
```

### Event-Driven Trading
```
Analyze this upcoming event for trading opportunity:

Event: [DESCRIBE EVENT]
[PASTE RELEVANT DATA]

Evaluate:

1. **Historical Precedent**: How have similar events played out?
2. **Market Expectations**: What's priced in?
3. **Scenario Analysis**: Bull/base/bear outcomes
4. **Probability Assessment**: Likelihood of each scenario
5. **Trade Structure**: How to position
6. **Risk Management**: Hedging the event
```

### Turnaround Situation
```
Evaluate this potential turnaround story:

[PASTE COMPANY DATA, RECENT DEVELOPMENTS]

Assess:

1. **Turnaround Catalyst**: What's changing?
2. **Management Credibility**: Can they execute?
3. **Balance Sheet**: Financial runway?
4. **Industry Position**: Competitive advantages?
5. **Valuation**: Risk/reward at current price?
6. **Timeline**: How long to profitability?
7. **Trade Structure**: Equity, options, or bonds?
```

---

## Meta-Analysis Prompts

### Learning from Mistakes
```
Analyze my losing trades to identify patterns:

[PASTE LOSING TRADES DATA]

Identify:

1. **Common Patterns**: Repeated mistakes?
2. **Entry Problems**: Entering too early/late?
3. **Exit Issues**: Holding too long?
4. **Position Sizing**: Too big/small?
5. **Market Conditions**: Specific environments where I struggle?
6. **Improvement Plan**: Specific rules to implement
```

### Strategy Performance Review
```
Evaluate my trading strategy performance:

[PASTE STRATEGY RULES AND TRADE RESULTS]

Analyze:

1. **Win Rate**: Actual vs. expected
2. **Risk/Reward**: Actual vs. planned
3. **Drawdown Analysis**: Maximum and average
4. **Market Correlation**: Performance vs. market
5. **Edge Validation**: Is there a real edge?
6. **Improvements**: Top 3 changes to make
```

---

## Quick Decision Prompts

### 30-Second Analysis
```
Quick analysis needed - should I buy [SYMBOL] here?

Price: $[CURRENT]
[PASTE ANY AVAILABLE DATA]

Give me:
- Buy/Pass/Short
- One-line reasoning
- Stop loss if buying
- Quick target
```

### Pre-Market Scanner
```
Scan this pre-market data for best opportunities:

[PASTE PRE-MARKET MOVERS]

Give me:
- Top 3 longs for the day
- Top 3 shorts for the day
- One-line reasoning each
```

### Exit Decision
```
Should I exit this position?

Entry: $[ENTRY PRICE]
Current: $[CURRENT PRICE]
Original Thesis: [THESIS]
[PASTE CURRENT DATA]

Decision: Hold/Sell/Add with brief reasoning
```

---

## Custom Template Builder

### Create Your Own Template
```
[SITUATION DESCRIPTION]

Analyze:

1. [SPECIFIC QUESTION 1]
2. [SPECIFIC QUESTION 2]
3. [SPECIFIC QUESTION 3]

Provide:
- [DESIRED OUTPUT 1]
- [DESIRED OUTPUT 2]
- [DESIRED OUTPUT 3]

Format: [SPECIFY FORMAT PREFERENCE]
```

---

## Tips for Using These Templates

1. **Customize for Your Style**: Modify templates to match your trading approach
2. **Include Relevant Data**: More context = better analysis
3. **Be Specific**: Clear questions get clear answers
4. **Iterate**: Refine prompts based on results
5. **Save Successful Prompts**: Build your personal library
6. **Time-box Analysis**: Don't over-analyze, set time limits
7. **Track Results**: Monitor which prompts lead to profitable trades

## Prompt Optimization Guidelines

### Data Format Best Practices
- Use consistent date formats (YYYY-MM-DD)
- Include timestamps for intraday data
- Specify currency ($, €, £)
- Label percentages clearly (% or decimal)
- Group related data together

### Question Structure
- Lead with most important question
- Number questions for easy reference
- Separate analysis from action items
- Request specific output format
- Include confidence levels when appropriate

### Context Setting
- Specify your trading style (day/swing/position)
- Include risk tolerance
- Mention account size if relevant
- State market hours/timezone
- Clarify any assumptions

---

Remember: These templates are starting points. The best prompts are ones you develop through experience with your specific trading style and needs.