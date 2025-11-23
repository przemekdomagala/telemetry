import { useState, useEffect, useCallback } from 'react';

const API_URL = 'http://localhost:8000/api/velocity';
const WS_URL = 'ws://localhost:8000/ws/velocity';

function BoatVelocityDisplay() {
  const [velocity, setVelocity] = useState(null);
  const [timestamp, setTimestamp] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const latestReading = data[0];
        
        setLastSuccessfulData(latestReading);
        
        if (!timestamp || new Date(latestReading.timestamp) > new Date(timestamp)) {
          setVelocity(latestReading.velocity);
          setTimestamp(latestReading.timestamp);
        }
      } else {
        throw new Error("Received empty or malformed data array from API.");
      }
      
      setError(null);

    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Data processing error: ${err.message}`); 
    } finally {
      setLoading(false);
    }
  };

    const [lastSuccessfulData, setLastSuccessfulData] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setWsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastSuccessfulData(data);
        setVelocity(data.velocity);
        setTimestamp(data.timestamp);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Error parsing WebSocket data:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setWsConnected(false);
      setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setError('WebSocket connection error');
      ws.close();
    };

    return ws;
  }, []);

  useEffect(() => {
    fetchData();
    
    const ws = connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connectWebSocket]);

  if (loading && !lastSuccessfulData) {
    return <div>Loading boat telemetry...</div>;
  }

  if (error && !lastSuccessfulData) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  const connectionStatus = wsConnected ? 
    <span style={{ color: 'green', fontSize: '12px' }}>●</span> : 
    <span style={{ color: 'red', fontSize: '12px' }}>●</span>;

  const lastUpdatedTime = timestamp ? new Date(timestamp).toLocaleTimeString() : 'N/A';
  
  return (
    <div >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2>Live Boat Velocity</h2>
        {connectionStatus}
      </div>
      <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0' }}>
        {velocity !== null ? velocity.toFixed(1) : '---'} 
        <span style={{ fontSize: '18px', fontWeight: 'normal' }}>m/s</span>
      </p>
      <p>Last updated: {lastUpdatedTime}</p>
    </div>
  );
}

export default BoatVelocityDisplay;