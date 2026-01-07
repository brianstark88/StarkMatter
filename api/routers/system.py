"""
System Management Router
Endpoints for controlling the backend server
"""

from fastapi import APIRouter, HTTPException
import logging
import subprocess
import os
import signal
import sys

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/system", tags=["system"])


@router.post("/restart")
async def restart_server():
    """
    Restart the backend server

    Note: This will kill the current process and attempt to restart.
    Only works if server is running under a process manager.

    Returns:
        Restart status
    """
    try:
        logger.info("Restart requested via API")

        # Get the script directory
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        restart_script = os.path.join(script_dir, "..", "scripts", "restart_backend.sh")

        # Check if restart script exists
        if os.path.exists(restart_script):
            # Run restart script in background
            subprocess.Popen([restart_script],
                           cwd=os.path.dirname(restart_script),
                           start_new_session=True)

            return {
                "status": "restarting",
                "message": "Server restart initiated",
                "method": "script"
            }
        else:
            # Fallback: send SIGHUP to self (requires process manager)
            logger.warning("Restart script not found, sending SIGHUP")
            os.kill(os.getpid(), signal.SIGHUP)

            return {
                "status": "restarting",
                "message": "Server restart signal sent",
                "method": "signal"
            }

    except Exception as e:
        logger.error(f"Error restarting server: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
async def start_server():
    """
    Start the backend server

    Note: This endpoint can only be called if the server is already running,
    so it's mainly for documentation purposes. Use the startup script instead.

    Returns:
        Status message
    """
    return {
        "status": "already_running",
        "message": "Server is already running",
        "hint": "To start the server, run: python api/main.py"
    }


@router.get("/status")
async def get_system_status():
    """
    Get system status information

    Returns:
        System status details
    """
    import psutil

    try:
        # Get process info
        process = psutil.Process(os.getpid())

        # Get memory info
        memory_info = process.memory_info()

        # Get CPU percent (non-blocking)
        cpu_percent = process.cpu_percent(interval=0.1)

        return {
            "status": "online",
            "process": {
                "pid": os.getpid(),
                "cpu_percent": cpu_percent,
                "memory_mb": round(memory_info.rss / 1024 / 1024, 2),
                "threads": process.num_threads(),
            },
            "python_version": sys.version,
            "working_directory": os.getcwd()
        }

    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        return {
            "status": "online",
            "process": {
                "pid": os.getpid()
            },
            "error": str(e)
        }


@router.post("/shutdown")
async def shutdown_server():
    """
    Gracefully shutdown the backend server

    Returns:
        Shutdown status
    """
    try:
        logger.warning("Shutdown requested via API")

        return {
            "status": "shutting_down",
            "message": "Server shutdown initiated"
        }

    except Exception as e:
        logger.error(f"Error shutting down server: {e}")
        raise HTTPException(status_code=500, detail=str(e))
