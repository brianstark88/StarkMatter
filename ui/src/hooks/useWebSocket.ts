import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
}

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnect = true,
  reconnectInterval = 3000
}: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        onOpen?.();

        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        onClose?.();

        // Attempt to reconnect if enabled
        if (reconnect && mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, reconnectInterval);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);

      // Attempt to reconnect on error
      if (reconnect && mountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      }
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    reconnect: connect,
    disconnect
  };
}

// Specialized hook for quote streaming
export function useQuoteStream(symbols: string[] = []) {
  const [quotes, setQuotes] = useState<Map<string, any>>(new Map());

  const { isConnected, sendMessage } = useWebSocket({
    url: 'ws://localhost:8000/ws/quotes',
    onMessage: (message) => {
      if (message.type === 'quotes' || message.type === 'initial') {
        const newQuotes = new Map(quotes);
        message.data?.forEach((quote: any) => {
          newQuotes.set(quote.symbol, quote);
        });
        setQuotes(newQuotes);
      }
    },
    onOpen: () => {
      // Subscribe to specific symbols if provided
      if (symbols.length > 0) {
        sendMessage({ type: 'subscribe', symbols });
      }
    }
  });

  return { quotes, isConnected };
}

// Hook for trade streaming for a specific symbol
export function useTradeStream(symbol: string) {
  const [trades, setTrades] = useState<any[]>([]);
  const maxTrades = 50; // Keep last 50 trades

  const { isConnected } = useWebSocket({
    url: `ws://localhost:8000/ws/trades/${symbol}`,
    onMessage: (message) => {
      if (message.type === 'trade') {
        setTrades(prev => {
          const newTrades = [message, ...prev];
          return newTrades.slice(0, maxTrades);
        });
      }
    }
  });

  return { trades, isConnected };
}