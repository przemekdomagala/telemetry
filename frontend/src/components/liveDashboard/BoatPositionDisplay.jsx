import { useState, useCallback } from 'react';
import useWebSocket from '../../hooks/useWebSocket';

const WS_URL = `${import.meta.env.VITE_WS_URL}/position`;

function BoatPositionDisplay() {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [velocity, setVelocity] = useState(null);
  const [heading, setHeading] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [hasData, setHasData] = useState(false);

  const onWebSocketMessage = useCallback((data) => {
    setHasData(true);
    setLatitude(data.latitude);
    setLongitude(data.longitude);
    setHeading(data.heading);
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
          <h2>Boat position data</h2>
          {connectionStatus}
        </div>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2>Boat position data</h2>
        {connectionStatus}
      </div>

      <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>
        {latitude !== null
          ? `Lat: ${latitude.toFixed(6)}°`
          : 'Lat: ---°'}<br></br>
        {longitude !== null
          ? `Lon: ${longitude.toFixed(6)}°`
          : 'Lon: ---°'}<br></br>
        {heading !== null ? `Heading: ${heading.toFixed(1)}°` : 'Heading: ---°'}<br></br>
        {velocity !== null ? ` Velocity: ${velocity.toFixed(1)} m/s` : '---'}
      </p>

      <p>Last updated: {lastUpdatedTime}</p>
    </div>
  );
}

export default BoatPositionDisplay;