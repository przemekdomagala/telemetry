import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import useWebSocket from '../../hooks/useWebSocket';
import 'leaflet/dist/leaflet.css';

const WS_URL = `${import.meta.env.VITE_WS_URL}/position`;
const OBSTACLES_WS_URL = `${import.meta.env.VITE_WS_URL}/obstacle`;
const TRAIL_LENGTH = 10;
const OBSTACLES_LENGTH = 10;

function MapUpdater({ center }) {
    const map = useMap();
    
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    
    return null;
}

export default function MapDisplay() {
    const [boatLatitude, setBoatLatitude] = useState(null);
    const [boatLongitude, setBoatLongitude] = useState(null);
    const [isFirstPosition, setIsFirstPosition] = useState(true);
    const [trail, setTrail] = useState([]);

    const [obstacleLatitude, setObstacleLatitude] = useState(null);
    const [obstacleLongitude, setObstacleLongitude] = useState(null);
    const [obstacles, setObstacles] = useState([]);

    useWebSocket(OBSTACLES_WS_URL, useCallback((data) => {
        setObstacleLatitude(data.latitude);
        setObstacleLongitude(data.longitude);

        setObstacles(prevObstacles => {
            const newObstacles = [...prevObstacles, [data.latitude, data.longitude]];
            return newObstacles.slice(-OBSTACLES_LENGTH);
        });
    }, []));
    

    const onWebSocketMessage = useCallback((data) => {
        setBoatLatitude(data.latitude);
        setBoatLongitude(data.longitude);
        
        setTrail(prevTrail => {
            const newTrail = [...prevTrail, [data.latitude, data.longitude]];
            return newTrail.slice(-TRAIL_LENGTH);
        });
        
        if (isFirstPosition) {
            setIsFirstPosition(false);
        }
    }, [isFirstPosition]);

    useWebSocket(WS_URL, onWebSocketMessage);

    const boatCenter = boatLatitude && boatLongitude ? [boatLatitude, boatLongitude] : [50.0328, 19.9905]; // default to Bagry lake

    return(
        <div className="map-display">
            <div className="container">

            <MapContainer 
                center={[50.0328, 19.9905]} 
                zoom={12} 
                style={{ height: "clamp(300px, 50vw, 400px)", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />
                {boatCenter && <MapUpdater center={boatCenter} />}
                {trail.length > 1 && (
                    <Polyline
                        positions={trail}
                        color="blue"
                        weight={3}
                        opacity={0.6}
                    />
                )}
                {boatLatitude && boatLongitude && (
                    <CircleMarker
                        center={[boatLatitude, boatLongitude]}
                        radius={8}
                        fillColor="blue"
                        color="white"
                        weight={2}
                        fillOpacity={0.8}
                    >
                        <Popup>
                            Boat Position<br />
                            Lat: {boatLatitude.toFixed(6)}°<br />
                            Lon: {boatLongitude.toFixed(6)}°
                        </Popup>
                    </CircleMarker>
                )}
                {obstacles.map((obstacle, index) => (
                    <CircleMarker
                        key={`obstacle-${index}`}
                        center={obstacle}
                        radius={6}
                        fillColor="red"
                        color="darkred"
                        weight={2}
                        fillOpacity={0.7}
                    >
                        <Popup>
                            Obstacle {index + 1}<br />
                            Lat: {obstacle[0].toFixed(6)}°<br />
                            Lon: {obstacle[1].toFixed(6)}°
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
            </div>
        </div>
    )
}