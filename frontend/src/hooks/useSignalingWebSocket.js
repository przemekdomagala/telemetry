import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = ({ onOffer, onIceCandidate, onPeerDisconnected, setStatus }) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const handlersRef = useRef({ onOffer, onIceCandidate, onPeerDisconnected, setStatus });
  const isMountedRef = useRef(true);

  useEffect(() => {
    handlersRef.current = { onOffer, onIceCandidate, onPeerDisconnected, setStatus };
  }, [onOffer, onIceCandidate, onPeerDisconnected, setStatus]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const wsBaseUrl = import.meta.env.VITE_WS_URL;
    const wsUrl = `${wsBaseUrl}/signaling`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      setIsConnected(true);
      handlersRef.current.setStatus({ message: 'Connected - Ready to receive streams', type: 'success' });
      sendMessage('identify', { type: 'receiver' });
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      setIsConnected(false);
      handlersRef.current.setStatus({ message: 'Disconnected from signaling server', type: 'error' });
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, 3000);
    };

    ws.onerror = () => {
      if (!isMountedRef.current) return;
      handlersRef.current.setStatus({ message: 'Connection error', type: 'error' });
    };

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return;
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
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { sendMessage, isConnected };
};

export default useWebSocket;