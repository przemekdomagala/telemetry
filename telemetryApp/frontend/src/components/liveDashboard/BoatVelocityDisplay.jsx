import { useState, useEffect, useCallback } from 'react';
import useWebSocket from '../../hooks/useWebSocket';
import useApi from '../../hooks/useApi';

const API_URL = 'http://localhost:8000/api/velocity';
const WS_URL = 'ws://localhost:8000/ws/velocity';

function BoatVelocityDisplay() {
  const [velocity, setVelocity] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [lastSuccessfulData, setLastSuccessfulData] = useState(null);

  const { data: apiData, isLoading, error: apiError } = useApi(API_URL);

  useEffect(() => {
    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      const latestReading = apiData[0];
      setVelocity(latestReading.velocity);
      setTimestamp(latestReading.timestamp);
      setLastSuccessfulData(latestReading);
    }
  }, [apiData]);

  const onWebSocketMessage = useCallback((data) => {
    setLastSuccessfulData(data);
    setVelocity(data.velocity);
    setTimestamp(data.timestamp);
  }, []);

  const wsConnected = useWebSocket(WS_URL, onWebSocketMessage);

  if (isLoading && !lastSuccessfulData) {
    return <div>Loading boat telemetry...</div>;
  }

  if (apiError && !lastSuccessfulData) {
    return <div style={{ color: 'red' }}>Error: {apiError}</div>;
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