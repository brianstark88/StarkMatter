"""
AI Analysis Router
API endpoints for AI-powered analysis using prompt templates
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging
import time
import json
from datetime import datetime

from services.ai import PromptManager, DataFormatter, ResponseParser
from database import execute_query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["ai"])

# Initialize services
prompt_manager = PromptManager()
data_formatter = DataFormatter()
response_parser = ResponseParser()


# Request/Response Models
class RenderPromptRequest(BaseModel):
    category: str
    template_name: str
    symbol: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = {}


class ImportResponseRequest(BaseModel):
    category: str
    template_name: str
    symbol: Optional[str] = None
    rendered_prompt: str
    response: str
    parameters: Optional[Dict[str, Any]] = {}


class AnalysisResponse(BaseModel):
    id: int
    template_category: str
    template_name: str
    symbol: Optional[str]
    response: str
    structured_data: Optional[Dict]
    created_at: str


@router.get("/templates")
async def list_templates(category: Optional[str] = None):
    """
    List all available AI analysis templates

    Args:
        category: Optional filter by category

    Returns:
        List of template metadata
    """
    try:
        templates = prompt_manager.list_templates(category)
        return {
            "templates": templates,
            "count": len(templates)
        }
    except Exception as e:
        logger.error(f"Error listing templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates/{category}/{name}")
async def get_template_info(category: str, name: str):
    """
    Get detailed information about a specific template

    Args:
        category: Template category
        name: Template name

    Returns:
        Template details including placeholders and metadata
    """
    try:
        template_info = prompt_manager.get_template_info(category, name)
        return template_info
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Template not found: {category}/{name}")
    except Exception as e:
        logger.error(f"Error getting template info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/render-prompt")
async def render_prompt(request: RenderPromptRequest):
    """
    Render a prompt template with data (for manual mode)

    This endpoint generates the complete prompt text that users can copy
    and paste into Claude Code CLI.

    Args:
        request: Template info and parameters

    Returns:
        Rendered prompt text ready to copy
    """
    try:
        start_time = time.time()

        # Load template
        template = prompt_manager.load_template(request.category, request.template_name)

        # Prepare data context based on template placeholders
        context = dict(request.parameters)

        # Add symbol if provided
        if request.symbol:
            context['symbol'] = request.symbol

        # Auto-populate data placeholders based on template requirements
        for placeholder_def in template.placeholders:
            name = placeholder_def['name']
            placeholder_type = placeholder_def.get('type', 'string')

            # Skip if already provided in parameters
            if name in context:
                continue

            # Auto-populate data types
            if placeholder_type == 'data':
                source = placeholder_def.get('source')
                token_budget = placeholder_def.get('token_budget', 500)

                if source == 'market_data' and request.symbol:
                    days = placeholder_def.get('days', 30)
                    context['price_data'] = data_formatter.format_market_data(
                        request.symbol, days, token_budget
                    )
                elif source == 'technical_indicators' and request.symbol:
                    context['indicators'] = data_formatter.format_technical_indicators(
                        request.symbol, token_budget
                    )
                elif source == 'news_summary' and request.symbol:
                    limit = placeholder_def.get('limit', 10)
                    context['news_summary'] = data_formatter.format_news_summary(
                        request.symbol, limit, token_budget
                    )
                elif source == 'portfolio_data':
                    context['portfolio_data'] = data_formatter.format_portfolio_data(token_budget)

        # Render prompt
        rendered = prompt_manager.render_template(template, context)

        execution_time_ms = int((time.time() - start_time) * 1000)

        return {
            "prompt": rendered,
            "template": {
                "category": request.category,
                "name": request.template_name,
                "version": template.version
            },
            "metadata": {
                "execution_time_ms": execution_time_ms,
                "estimated_tokens": len(rendered) // 4,  # Rough estimate
                "temperature": template.metadata.get('temperature', 0.3),
                "max_tokens": template.metadata.get('max_tokens', 2048)
            },
            "parameters": context
        }

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Template not found: {request.category}/{request.template_name}"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error rendering prompt: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import-response")
async def import_response(request: ImportResponseRequest):
    """
    Import a Claude response after manual execution

    Users paste the response they got from Claude Code CLI,
    and this endpoint parses and stores it.

    Args:
        request: Prompt details and Claude response

    Returns:
        Stored analysis with parsed data
    """
    try:
        start_time = time.time()

        # Parse the response
        parsed = response_parser.parse(
            request.response,
            f"{request.category}_{request.template_name}"
        )

        # Store in database
        query = """
            INSERT INTO ai_analyses (
                template_category, template_name, symbol,
                input_data, rendered_prompt, response,
                structured_data, execution_time_ms, model, execution_mode
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        execution_time_ms = int((time.time() - start_time) * 1000)

        result = execute_query(
            query,
            (
                request.category,
                request.template_name,
                request.symbol,
                json.dumps(request.parameters),
                request.rendered_prompt,
                request.response,
                json.dumps(parsed.to_dict()),
                execution_time_ms,
                'claude-sonnet-4',  # Assumed model
                'manual'
            )
        )

        # Get the inserted ID
        get_id_query = "SELECT last_insert_rowid() as id"
        id_result = execute_query(get_id_query, fetch='one')
        analysis_id = id_result['id']

        return {
            "id": analysis_id,
            "template_category": request.category,
            "template_name": request.template_name,
            "symbol": request.symbol,
            "response": request.response,
            "parsed": parsed.to_dict(),
            "created_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error importing response: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(
    symbol: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(default=20, le=100)
):
    """
    Get analysis history

    Args:
        symbol: Filter by symbol
        category: Filter by template category
        limit: Maximum results to return

    Returns:
        List of past analyses
    """
    try:
        # Build query dynamically based on filters
        where_clauses = []
        params = []

        if symbol:
            where_clauses.append("symbol = ?")
            params.append(symbol)

        if category:
            where_clauses.append("template_category = ?")
            params.append(category)

        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

        query = f"""
            SELECT id, template_category, template_name, symbol,
                   response, structured_data, created_at, execution_mode
            FROM ai_analyses
            {where_sql}
            ORDER BY created_at DESC
            LIMIT ?
        """

        params.append(limit)

        analyses = execute_query(query, tuple(params), fetch='all')

        # Parse structured_data JSON
        for analysis in analyses:
            if analysis.get('structured_data'):
                try:
                    analysis['structured_data'] = json.loads(analysis['structured_data'])
                except:
                    analysis['structured_data'] = None

        return {
            "analyses": analyses,
            "count": len(analyses)
        }

    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{analysis_id}")
async def get_analysis(analysis_id: int):
    """
    Get a specific analysis by ID

    Args:
        analysis_id: Analysis ID

    Returns:
        Full analysis details
    """
    try:
        query = """
            SELECT id, template_category, template_name, symbol,
                   input_data, rendered_prompt, response, structured_data,
                   execution_time_ms, tokens_used, model, execution_mode, created_at
            FROM ai_analyses
            WHERE id = ?
        """

        analysis = execute_query(query, (analysis_id,), fetch='one')

        if not analysis:
            raise HTTPException(status_code=404, detail=f"Analysis not found: {analysis_id}")

        # Parse JSON fields
        if analysis.get('input_data'):
            try:
                analysis['input_data'] = json.loads(analysis['input_data'])
            except:
                pass

        if analysis.get('structured_data'):
            try:
                analysis['structured_data'] = json.loads(analysis['structured_data'])
            except:
                pass

        return analysis

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{analysis_id}")
async def delete_analysis(analysis_id: int):
    """
    Delete an analysis

    Args:
        analysis_id: Analysis ID to delete

    Returns:
        Success message
    """
    try:
        # Check if exists
        check_query = "SELECT id FROM ai_analyses WHERE id = ?"
        exists = execute_query(check_query, (analysis_id,), fetch='one')

        if not exists:
            raise HTTPException(status_code=404, detail=f"Analysis not found: {analysis_id}")

        # Delete
        delete_query = "DELETE FROM ai_analyses WHERE id = ?"
        execute_query(delete_query, (analysis_id,))

        return {
            "success": True,
            "message": f"Analysis {analysis_id} deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def ai_health():
    """
    AI service health check

    Returns:
        Service health status
    """
    try:
        templates = prompt_manager.list_templates()

        # Check database
        count_query = "SELECT COUNT(*) as count FROM ai_analyses"
        count_result = execute_query(count_query, fetch='one')

        # Get last analysis time
        last_query = "SELECT created_at FROM ai_analyses ORDER BY created_at DESC LIMIT 1"
        last_result = execute_query(last_query, fetch='one')

        return {
            "status": "healthy",
            "templates_loaded": len(templates),
            "total_analyses": count_result['count'] if count_result else 0,
            "last_analysis": last_result['created_at'] if last_result else None,
            "services": {
                "prompt_manager": "ok",
                "data_formatter": "ok",
                "response_parser": "ok"
            }
        }

    except Exception as e:
        logger.error(f"AI health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }
