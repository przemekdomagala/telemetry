import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import useHistoricData from '../../hooks/useHistoricData';
import 'leaflet/dist/leaflet.css';

const POSITION_API_URL = `${import.meta.env.VITE_API_URL}/position`;
const OBSTACLES_API_URL = `${import.meta.env.VITE_API_URL}/obstacle`;

function MapHistoric({ selectedStart, selectedEnd }) {
    const { filteredData: positionData, isLoading: positionLoading, error: positionError } = useHistoricData(
        POSITION_API_URL,
        selectedStart,
        selectedEnd
    );

    const { filteredData: obstacleData, isLoading: obstacleLoading, error: obstacleError } = useHistoricData(
        OBSTACLES_API_URL,
        selectedStart,
        selectedEnd
    );

    // Convert position data to trail coordinates
    const trail = useMemo(() => {
        if (!positionData || positionData.length === 0) return [];
        return positionData.map(point => [point.latitude, point.longitude]);
    }, [positionData]);

    // Convert obstacle data to coordinates
    const obstacles = useMemo(() => {
        if (!obstacleData || obstacleData.length === 0) return [];
        return obstacleData.map(point => [point.latitude, point.longitude]);
    }, [obstacleData]);

    // Get last boat position (most recent in time range)
    const lastPosition = useMemo(() => {
        if (!positionData || positionData.length === 0) return null;
        const last = positionData[positionData.length - 1];
        return [last.latitude, last.longitude];
    }, [positionData]);

    // Use last position as map center
    const mapCenter = useMemo(() => {
        if (lastPosition) {
            return lastPosition;
        }
        return [50.0328, 19.9905]; // Default to Bagry lake
    }, [lastPosition]);

    const isLoading = positionLoading || obstacleLoading;
    const error = positionError || obstacleError;

    return (
        <div className="historic-card">
            <h2 className="historic-title">Boat Trail and Obstacles Map</h2>
            {isLoading && <div className="loading-message">Loading map data...</div>}
            {error && <div className="error-message">Error loading data: {error}</div>}
            {!isLoading && !error && positionData && positionData.length === 0 && (
                <div className="empty-message">No position data found for this time range.</div>
            )}
            {!isLoading && !error && positionData && positionData.length > 0 && (
                <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                    <MapContainer 
                        center={mapCenter} 
                        zoom={13} 
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap contributors"
                        />
                        
                        {/* Boat trail */}
                        {trail.length > 1 && (
                            <Polyline
                                positions={trail}
                                color="blue"
                                weight={3}
                                opacity={0.6}
                            />
                        )}
                        
                        {/* Last boat position marker */}
                        {lastPosition && (
                            <CircleMarker
                                center={lastPosition}
                                radius={8}
                                fillColor="blue"
                                color="white"
                                weight={2}
                                fillOpacity={0.8}
                            >
                                <Popup>
                                    Last Boat Position<br />
                                    Lat: {lastPosition[0].toFixed(6)}°<br />
                                    Lon: {lastPosition[1].toFixed(6)}°
                                </Popup>
                            </CircleMarker>
                        )}
                        
                        {/* Obstacle markers */}
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
            )}
        </div>
    );
}

export default MapHistoric;
