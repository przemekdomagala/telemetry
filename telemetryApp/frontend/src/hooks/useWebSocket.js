import { useState, useEffect } from 'react';

const useWebSocket = (url, onMessage) => {
    const [isConnected, setIsConnected] = useState(false);
    
    useEffect(() => {
        const socket = new WebSocket(url);

        socket.onopen = () => {
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
        };

        socket.onclose = () => {
            setIsConnected(false);
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            socket.close();
        };

        return () => {
            socket.close();
        };
    }, [url, onMessage]);

    return isConnected;
};

export default useWebSocket;