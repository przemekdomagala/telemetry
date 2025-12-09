import React, { useState, useCallback } from 'react';
import useWebSocket from '../../hooks/useWebSocket';

const WS_URL = `${import.meta.env.VITE_WS_URL}/mission`;

export default function MissionDescriptionDisplay(){

    const [description, setDescription] = useState(null);
    const [hasData, setHasData] = useState(false);

    const onWebSocketMessage = useCallback((data) => {
        setDescription(data.description);
        setHasData(true);
    }, []);

    useWebSocket(WS_URL, onWebSocketMessage);

    if (!hasData) {
        return(
            <div className="mission-description-display">
                <div className="container">
                    <h4>Mission Description</h4>
                    <p>No data available</p>
                </div>
            </div>
        );
    }

    return(
        <div className="mission-description-display">
            <div className="container">
                <h4>Mission Description</h4>
                <p>{description}</p>
            </div>
        </div>
    );
}