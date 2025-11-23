import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = ({ onOffer, onIceCandidate, onPeerDisconnected, setStatus }) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const handlersRef = useRef({ onOffer, onIceCandidate, onPeerDisconnected, setStatus });

  // Keep handlers ref up to date
  useEffect(() => {
    handlersRef.current = { onOffer, onIceCandidate, onPeerDisconnected, setStatus };
  }, [onOffer, onIceCandidate, onPeerDisconnected, setStatus]);

  const sendMessage = useCallback((event, data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, data }));
    }
  }, []);

  const handleMessage = useCallback((message) => {
    const { event, data } = message;
    const handlers = handlersRef.current;
    
    switch (event) {
      case 'paired':
        handlers.setStatus({ message: `Paired with sender (${data.peerId})`, type: 'info' });
        break;
      case 'offer':
        handlers.onOffer(data);
        break;
      case 'ice-candidate':
        handlers.onIceCandidate(data);
        break;
      case 'peer-disconnected':
        handlers.onPeerDisconnected();
        break;
    }
  }, []);

  const connect = useCallback(() => {
    // Use environment variable or default to backend port
    const backendHost = import.meta.env.VITE_BACKEND_URL || 'localhost:8000';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${backendHost}/ws/signaling`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      handlersRef.current.setStatus({ message: 'Connected - Ready to receive streams', type: 'success' });
      sendMessage('identify', { type: 'receiver' });
    };

    ws.onclose = () => {
      setIsConnected(false);
      handlersRef.current.setStatus({ message: 'Disconnected from signaling server', type: 'error' });
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = () => {
      handlersRef.current.setStatus({ message: 'Connection error', type: 'error' });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
  }, [handleMessage, sendMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { sendMessage, isConnected };
};

export default useWebSocket;