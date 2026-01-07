import { useState, useEffect } from 'react';
import { Server, PlayCircle, RefreshCw, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function BackendStatus() {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [showControls, setShowControls] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });

      if (response.ok) {
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch (error) {
      setStatus('offline');
    }
  };

  useEffect(() => {
    // Check immediately
    checkStatus();

    // Check every 10 seconds
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleStartBackend = async () => {
    try {
      setIsRestarting(true);

      // Call the start endpoint
      const response = await fetch('http://localhost:8000/api/system/start', {
        method: 'POST',
      });

      if (response.ok) {
        // Wait a bit for server to start
        setTimeout(() => {
          checkStatus();
          setIsRestarting(false);
        }, 3000);
      } else {
        alert('Failed to start backend. Please start manually: python api/main.py');
        setIsRestarting(false);
      }
    } catch (error) {
      // If backend is truly offline, we can't call it to start itself
      // Show instructions instead
      alert(
        'Backend is offline. Please start it manually:\n\n' +
        '1. Open terminal\n' +
        '2. cd to StarkMatter directory\n' +
        '3. Run: source venv/bin/activate\n' +
        '4. Run: python api/main.py'
      );
      setIsRestarting(false);
    }
  };

  const handleRestartBackend = async () => {
    try {
      setIsRestarting(true);

      const response = await fetch('http://localhost:8000/api/system/restart', {
        method: 'POST',
      });

      if (response.ok) {
        // Wait for server to restart
        setTimeout(() => {
          checkStatus();
          setIsRestarting(false);
        }, 5000);
      } else {
        alert('Failed to restart backend');
        setIsRestarting(false);
      }
    } catch (error) {
      alert('Failed to restart backend');
      setIsRestarting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowControls(!showControls)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
          status === 'online'
            ? "bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30"
            : status === 'offline'
            ? "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
            : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
        )}
      >
        <div className="flex items-center space-x-2">
          <Server className={cn(
            "w-4 h-4",
            status === 'online' ? "text-green-600 dark:text-green-400"
            : status === 'offline' ? "text-red-600 dark:text-red-400"
            : "text-gray-400"
          )} />
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Backend
            </span>
            <span className={cn(
              "text-xs",
              status === 'online' ? "text-green-600 dark:text-green-400"
              : status === 'offline' ? "text-red-600 dark:text-red-400"
              : "text-gray-500"
            )}>
              {status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Checking...'}
            </span>
          </div>
        </div>
        <div className={cn(
          "w-2 h-2 rounded-full",
          status === 'online' ? "bg-green-500 animate-pulse"
          : status === 'offline' ? "bg-red-500"
          : "bg-gray-400"
        )} />
      </button>

      {/* Controls dropdown */}
      {showControls && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 space-y-1">
          {status === 'offline' ? (
            <button
              onClick={handleStartBackend}
              disabled={isRestarting}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
            >
              {isRestarting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>Start Backend</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleRestartBackend}
              disabled={isRestarting}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50"
            >
              {isRestarting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Restarting...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Restart Backend</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={checkStatus}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Status</span>
          </button>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
            >
              <Server className="w-4 h-4" />
              <span>API Docs</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
