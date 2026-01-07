"""
Prompt Manager for AI Analysis
Handles loading and rendering of YAML prompt templates using Jinja2
"""

import yaml
from pathlib import Path
from jinja2 import Template, Environment, FileSystemLoader
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

# Paths
PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"


class PromptTemplate:
    """Represents a loaded prompt template"""

    def __init__(self, data: Dict):
        self.name = data.get('name')
        self.category = data.get('category')
        self.version = data.get('version', '1.0.0')
        self.description = data.get('description', '')
        self.metadata = data.get('metadata', {})
        self.placeholders = data.get('placeholders', [])
        self.few_shot_examples = data.get('few_shot_examples', [])
        self.chain_of_thought = data.get('chain_of_thought', {})
        self.system_prompt = data.get('system_prompt', '')
        self.user_prompt = data.get('user_prompt', '')
        self.output_format = data.get('output_format', {})

    def get_required_placeholders(self) -> List[str]:
        """Get list of required placeholder names"""
        return [p['name'] for p in self.placeholders if p.get('required', False)]

    def get_all_placeholders(self) -> List[str]:
        """Get list of all placeholder names"""
        return [p['name'] for p in self.placeholders]

    def to_dict(self) -> Dict:
        """Convert template to dictionary for API responses"""
        return {
            'name': self.name,
            'category': self.category,
            'version': self.version,
            'description': self.description,
            'metadata': self.metadata,
            'placeholders': self.placeholders,
            'output_format': self.output_format
        }


class PromptManager:
    """Manages loading, rendering, and validation of prompt templates"""

    def __init__(self):
        self.templates_cache: Dict[str, PromptTemplate] = {}
        self.jinja_env = Environment(
            loader=FileSystemLoader(PROMPTS_DIR),
            autoescape=False  # Don't escape for markdown/text output
        )

    def load_template(self, category: str, name: str) -> PromptTemplate:
        """
        Load a template from YAML file

        Args:
            category: Template category (technical, fundamental, etc.)
            name: Template name (chart_analysis, news_sentiment, etc.)

        Returns:
            PromptTemplate object
        """
        cache_key = f"{category}/{name}"

        # Check cache
        if cache_key in self.templates_cache:
            return self.templates_cache[cache_key]

        # Load from file
        template_path = PROMPTS_DIR / category / f"{name}.yaml"

        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {cache_key}")

        try:
            with open(template_path, 'r') as f:
                data = yaml.safe_load(f)

            template = PromptTemplate(data)
            self.templates_cache[cache_key] = template

            logger.info(f"Loaded template: {cache_key}")
            return template

        except Exception as e:
            logger.error(f"Error loading template {cache_key}: {e}")
            raise

    def list_templates(self, category: Optional[str] = None) -> List[Dict]:
        """
        List all available templates

        Args:
            category: Optional category filter

        Returns:
            List of template metadata dicts
        """
        templates = []

        # Determine which categories to scan
        if category:
            categories = [category]
        else:
            categories = [d.name for d in PROMPTS_DIR.iterdir() if d.is_dir()]

        for cat in categories:
            cat_path = PROMPTS_DIR / cat
            if not cat_path.exists():
                continue

            # Find all YAML files
            for yaml_file in cat_path.glob("*.yaml"):
                try:
                    template = self.load_template(cat, yaml_file.stem)
                    templates.append({
                        'category': cat,
                        'name': template.name,
                        'version': template.version,
                        'description': template.description,
                        'metadata': template.metadata
                    })
                except Exception as e:
                    logger.error(f"Error listing template {cat}/{yaml_file.stem}: {e}")

        return templates

    def render_template(self, template: PromptTemplate, data: Dict) -> str:
        """
        Render template with data using Jinja2

        Args:
            template: PromptTemplate object
            data: Dictionary of placeholder values

        Returns:
            Rendered prompt string
        """
        # Validate required placeholders
        missing = []
        for placeholder in template.get_required_placeholders():
            if placeholder not in data:
                missing.append(placeholder)

        if missing:
            raise ValueError(f"Missing required placeholders: {missing}")

        # Apply defaults for optional placeholders
        for placeholder_def in template.placeholders:
            name = placeholder_def['name']
            if name not in data and 'default' in placeholder_def:
                data[name] = placeholder_def['default']

        # Add few-shot examples and chain-of-thought to context
        context = {
            **data,
            'few_shot_examples': template.few_shot_examples,
            'chain_of_thought': template.chain_of_thought
        }

        # Render system and user prompts
        try:
            system_template = Template(template.system_prompt)
            user_template = Template(template.user_prompt)

            system_rendered = system_template.render(context).strip()
            user_rendered = user_template.render(context).strip()

            # Combine into full prompt
            if system_rendered:
                full_prompt = f"System: {system_rendered}\n\nUser: {user_rendered}"
            else:
                full_prompt = user_rendered

            return full_prompt

        except Exception as e:
            logger.error(f"Error rendering template {template.category}/{template.name}: {e}")
            raise

    def validate_placeholders(self, template: PromptTemplate, data: Dict) -> tuple[bool, List[str]]:
        """
        Validate that all required placeholders are present

        Args:
            template: PromptTemplate object
            data: Dictionary of placeholder values

        Returns:
            (is_valid, list_of_errors)
        """
        errors = []

        for placeholder_def in template.placeholders:
            name = placeholder_def['name']
            required = placeholder_def.get('required', False)

            if required and name not in data:
                errors.append(f"Missing required placeholder: {name}")

            # Type validation
            if name in data:
                expected_type = placeholder_def.get('type', 'string')
                value = data[name]

                if expected_type == 'string' and not isinstance(value, str):
                    errors.append(f"Placeholder '{name}' must be a string")
                elif expected_type == 'number' and not isinstance(value, (int, float)):
                    errors.append(f"Placeholder '{name}' must be a number")

                # Regex validation if provided
                if 'validation' in placeholder_def and isinstance(value, str):
                    import re
                    pattern = placeholder_def['validation']
                    if not re.match(pattern, value):
                        errors.append(f"Placeholder '{name}' failed validation: {pattern}")

        return len(errors) == 0, errors

    def get_template_info(self, category: str, name: str) -> Dict:
        """
        Get detailed information about a template

        Args:
            category: Template category
            name: Template name

        Returns:
            Dictionary with template details
        """
        template = self.load_template(category, name)
        return template.to_dict()
