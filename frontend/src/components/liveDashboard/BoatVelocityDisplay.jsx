import { useState, useCallback } from 'react';
import useWebSocket from '../../hooks/useWebSocket';

const WS_URL = `${import.meta.env.VITE_WS_URL}/position`;

function BoatVelocityDisplay() {
  const [velocity, setVelocity] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [hasData, setHasData] = useState(false);

  const onWebSocketMessage = useCallback((data) => {
    setHasData(true);
    setVelocity(data.velocity);
    setTimestamp(data.timestamp);
  }, []);

  const wsConnected = useWebSocket(WS_URL, onWebSocketMessage);

  const connectionStatus = wsConnected ? 
    <span style={{ color: 'green', fontSize: '12px' }}>●</span> : 
    <span style={{ color: 'red', fontSize: '12px' }}>●</span>;

  const lastUpdatedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString()
    : 'N/A';

  if (!hasData) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2>Live Boat Velocity</h2>
          {connectionStatus}
        </div>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2>Live Boat Velocity</h2>
        {connectionStatus}
      </div>

      <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '10px 0' }}>
        {velocity !== null ? velocity.toFixed(1) : '---'}
        <span style={{ fontSize: '18px', fontWeight: 'normal' }}> m/s</span>
      </p>

      <p>Last updated: {lastUpdatedTime}</p>
    </div>
  );
}

export default BoatVelocityDisplay;