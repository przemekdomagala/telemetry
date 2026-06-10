
import { useState, useCallback } from 'react';
import useWebSocket from '../../hooks/useWebSocket';

const POSITION_WS_URL = `${import.meta.env.VITE_WS_URL}/position`;
const VELOCITY_WS_URL = `${import.meta.env.VITE_WS_URL}/velocity`;


function BoatPositionDisplay() {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [heading, setHeading] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [hasPosition, setHasPosition] = useState(false);

  const [velocity, setVelocity] = useState(null);
  const [velocityTimestamp, setVelocityTimestamp] = useState(null);
  const [hasVelocity, setHasVelocity] = useState(false);

  const onPositionMessage = useCallback((data) => {
    setHasPosition(true);
    setLatitude(data.latitude);
    setLongitude(data.longitude);
    setHeading(data.heading);
    setTimestamp(data.timestamp);
  }, []);

  const onVelocityMessage = useCallback((data) => {
    setHasVelocity(true);
    setVelocity(data.velocity);
    setVelocityTimestamp(data.timestamp);
  }, []);

  useWebSocket(POSITION_WS_URL, onPositionMessage);
  useWebSocket(VELOCITY_WS_URL, onVelocityMessage);

  if (!hasPosition && !hasVelocity) {
    return (
      <div className="container">
        <h4>Boat position & velocity</h4>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h4>Boat position & velocity</h4>
      <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>
        {latitude !== null
          ? `Lat: ${latitude.toFixed(6)}°`
          : 'Lat: ---°'}<br />
        {longitude !== null
          ? `Lon: ${longitude.toFixed(6)}°`
          : 'Lon: ---°'}<br />
        {heading !== null ? `Heading: ${heading.toFixed(1)}°` : 'Heading: ---°'}<br />
        {hasVelocity && velocity !== null
          ? `Velocity: ${velocity.toFixed(1)} m/s`
          : 'Velocity: ---'}
      </p>
    </div>
  );
}

export default BoatPositionDisplay;