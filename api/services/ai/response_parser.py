"""
Response Parser for AI Analysis
Parses Claude AI responses and extracts structured data
Multi-tier parsing strategy for handling unpredictable LLM outputs
"""

import re
import json
import logging
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)


class ParsedResponse:
    """Represents a parsed AI response"""

    def __init__(
        self,
        raw: str,
        structured: Optional[Dict] = None,
        sections: Optional[Dict[str, str]] = None,
        metadata: Optional[Dict] = None
    ):
        self.raw = raw
        self.structured = structured or {}
        self.sections = sections or {}
        self.metadata = metadata or {}

    def to_dict(self) -> Dict:
        """Convert to dictionary for API responses"""
        return {
            'raw': self.raw,
            'structured': self.structured,
            'sections': self.sections,
            'metadata': self.metadata
        }


class ResponseParser:
    """Parses AI responses with multi-tier strategy"""

    def parse(
        self,
        response: str,
        template_name: Optional[str] = None
    ) -> ParsedResponse:
        """
        Parse AI response using multi-tier strategy

        Args:
            response: Raw AI response text
            template_name: Optional template name for specialized parsing

        Returns:
            ParsedResponse object
        """
        # Tier 1: Try JSON extraction
        json_data = self._extract_json(response)

        # Tier 2: Parse markdown sections
        sections = self._parse_markdown_sections(response)

        # Tier 3: Extract metadata (numbers, tickers, etc.)
        metadata = self._extract_metadata(response)

        # Template-specific parsing
        if template_name:
            if 'technical' in template_name or 'chart_analysis' in template_name:
                metadata.update(self._parse_technical_analysis(response))
            elif 'trade' in template_name or 'signal' in template_name:
                metadata.update(self._parse_trade_signal(response))

        return ParsedResponse(
            raw=response,
            structured=json_data,
            sections=sections,
            metadata=metadata
        )

    def _extract_json(self, text: str) -> Dict:
        """
        Extract JSON blocks from response

        Args:
            text: Response text

        Returns:
            Extracted JSON data or empty dict
        """
        try:
            # Look for JSON code blocks
            json_pattern = r'```json\s*\n(.*?)\n```'
            matches = re.findall(json_pattern, text, re.DOTALL)

            if matches:
                # Try to parse first match
                return json.loads(matches[0])

            # Try to find raw JSON objects
            json_obj_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
            matches = re.findall(json_obj_pattern, text)

            for match in matches:
                try:
                    data = json.loads(match)
                    if isinstance(data, dict) and len(data) > 0:
                        return data
                except:
                    continue

        except Exception as e:
            logger.debug(f"No JSON found in response: {e}")

        return {}

    def _parse_markdown_sections(self, text: str) -> Dict[str, str]:
        """
        Parse markdown sections by headers

        Args:
            text: Response text

        Returns:
            Dictionary mapping section names to content
        """
        sections = {}

        # Match h2 headers (##) and capture content until next header
        pattern = r'##\s+([^\n]+)\s*\n(.*?)(?=##|\Z)'
        matches = re.findall(pattern, text, re.DOTALL)

        for header, content in matches:
            # Clean header
            header = header.strip().strip('#').strip()
            # Clean content
            content = content.strip()
            sections[header] = content

        # Also try h3 headers (###)
        pattern = r'###\s+([^\n]+)\s*\n(.*?)(?=###|\Z)'
        matches = re.findall(pattern, text, re.DOTALL)

        for header, content in matches:
            header = header.strip().strip('#').strip()
            content = content.strip()
            # Only add if not already captured by h2
            if header not in sections:
                sections[header] = content

        return sections

    def _extract_metadata(self, text: str) -> Dict[str, Any]:
        """
        Extract metadata like numbers, tickers, dates

        Args:
            text: Response text

        Returns:
            Dictionary of extracted metadata
        """
        metadata = {}

        # Extract stock tickers (3-5 uppercase letters)
        tickers = re.findall(r'\b[A-Z]{2,5}\b', text)
        if tickers:
            # Filter out common words
            common_words = {'THE', 'AND', 'FOR', 'NOT', 'BUT', 'ARE', 'WAS', 'BEEN', 'THIS', 'THAT', 'WITH'}
            tickers = [t for t in tickers if t not in common_words]
            metadata['mentioned_tickers'] = list(set(tickers))

        # Extract prices ($XX.XX)
        prices = re.findall(r'\$(\d+(?:\.\d{2})?)', text)
        if prices:
            metadata['mentioned_prices'] = [float(p) for p in prices[:10]]  # Limit to 10

        # Extract percentages (XX.X%)
        percentages = re.findall(r'([-+]?\d+(?:\.\d+)?)\s*%', text)
        if percentages:
            metadata['mentioned_percentages'] = [float(p) for p in percentages[:10]]

        # Extract dates (YYYY-MM-DD)
        dates = re.findall(r'\b\d{4}-\d{2}-\d{2}\b', text)
        if dates:
            metadata['mentioned_dates'] = list(set(dates))

        return metadata

    def _parse_technical_analysis(self, text: str) -> Dict[str, Any]:
        """
        Extract technical analysis specific data

        Args:
            text: Response text

        Returns:
            Dictionary with technical analysis fields
        """
        data = {}

        # Trend direction
        if re.search(r'\b(bullish|uptrend|up\s*trend)\b', text, re.IGNORECASE):
            data['trend_direction'] = 'bullish'
        elif re.search(r'\b(bearish|downtrend|down\s*trend)\b', text, re.IGNORECASE):
            data['trend_direction'] = 'bearish'
        elif re.search(r'\b(sideways|neutral|range[- ]?bound)\b', text, re.IGNORECASE):
            data['trend_direction'] = 'sideways'

        # Confidence level
        if re.search(r'\b(confidence|confidence\s*level):\s*(high|medium|low)\b', text, re.IGNORECASE):
            match = re.search(r'\b(confidence|confidence\s*level):\s*(high|medium|low)\b', text, re.IGNORECASE)
            data['confidence'] = match.group(2).lower()

        # Support and resistance levels
        support_matches = re.findall(r'support[:\s]*\$?(\d+(?:\.\d{2})?)', text, re.IGNORECASE)
        if support_matches:
            data['support_levels'] = [float(s) for s in support_matches[:3]]

        resistance_matches = re.findall(r'resistance[:\s]*\$?(\d+(?:\.\d{2})?)', text, re.IGNORECASE)
        if resistance_matches:
            data['resistance_levels'] = [float(r) for r in resistance_matches[:3]]

        return data

    def _parse_trade_signal(self, text: str) -> Dict[str, Any]:
        """
        Extract trade signal specific data

        Args:
            text: Response text

        Returns:
            Dictionary with trade signal fields
        """
        data = {}

        # Direction (BUY/SELL/HOLD)
        if re.search(r'\b(direction|action|signal):\s*(buy|long)\b', text, re.IGNORECASE):
            data['direction'] = 'BUY'
        elif re.search(r'\b(direction|action|signal):\s*(sell|short)\b', text, re.IGNORECASE):
            data['direction'] = 'SELL'
        elif re.search(r'\b(direction|action|signal):\s*hold\b', text, re.IGNORECASE):
            data['direction'] = 'HOLD'

        # Entry price
        entry_match = re.search(r'entry[:\s]*\$?(\d+(?:\.\d{2})?)', text, re.IGNORECASE)
        if entry_match:
            data['entry_price'] = float(entry_match.group(1))

        # Stop loss
        stop_match = re.search(r'stop\s*loss[:\s]*\$?(\d+(?:\.\d{2})?)', text, re.IGNORECASE)
        if stop_match:
            data['stop_loss'] = float(stop_match.group(1))

        # Take profit / Target
        target_match = re.search(r'(take\s*profit|target)[:\s]*\$?(\d+(?:\.\d{2})?)', text, re.IGNORECASE)
        if target_match:
            data['take_profit'] = float(target_match.group(2))

        # Risk/Reward ratio
        rr_match = re.search(r'r[:/]?r|risk[:/]reward)[:\s]*(\d+(?:\.\d+)?)[:\s]*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
        if rr_match:
            data['risk_reward_ratio'] = f"{rr_match.group(1)}:{rr_match.group(2)}"
        else:
            # Try simpler pattern like "1:2"
            rr_match = re.search(r'\b(\d+)[:\s]*(\d+)\s*(r[:/]?r|ratio)', text, re.IGNORECASE)
            if rr_match:
                data['risk_reward_ratio'] = f"{rr_match.group(1)}:{rr_match.group(2)}"

        return data

    def parse_technical_analysis(self, response: str) -> Dict[str, Any]:
        """
        Specialized parser for technical analysis templates

        Args:
            response: AI response text

        Returns:
            Structured technical analysis data
        """
        parsed = self.parse(response, 'technical_analysis')

        return {
            'raw_response': parsed.raw,
            'sections': parsed.sections,
            'trend_direction': parsed.metadata.get('trend_direction'),
            'confidence': parsed.metadata.get('confidence'),
            'support_levels': parsed.metadata.get('support_levels', []),
            'resistance_levels': parsed.metadata.get('resistance_levels', []),
            'mentioned_tickers': parsed.metadata.get('mentioned_tickers', []),
            'full_metadata': parsed.metadata
        }

    def parse_trade_signal(self, response: str) -> Dict[str, Any]:
        """
        Specialized parser for trade signal templates

        Args:
            response: AI response text

        Returns:
            Structured trade signal data
        """
        parsed = self.parse(response, 'trade_signal')

        return {
            'raw_response': parsed.raw,
            'sections': parsed.sections,
            'direction': parsed.metadata.get('direction'),
            'entry_price': parsed.metadata.get('entry_price'),
            'stop_loss': parsed.metadata.get('stop_loss'),
            'take_profit': parsed.metadata.get('take_profit'),
            'risk_reward_ratio': parsed.metadata.get('risk_reward_ratio'),
            'full_metadata': parsed.metadata
        }

    def extract_structured_data(self, response: str) -> Dict[str, Any]:
        """
        General purpose structured data extraction

        Args:
            response: AI response text

        Returns:
            All extracted structured data
        """
        parsed = self.parse(response)
        return {
            'sections': parsed.sections,
            'metadata': parsed.metadata,
            'structured': parsed.structured
        }
