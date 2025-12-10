import React, { useState, useCallback } from 'react';
import useWebSocket from '../../hooks/useWebSocket';

const WS_URL = `${import.meta.env.VITE_WS_URL}/mode`;

export default function StatusDisplay(){
    
    const [mode, setMode] = useState(null);
    const [hasData, setHasData] = useState(false);
    
    const onWebSocketMessage = useCallback((data) => {
        setMode(data.mode);
        setHasData(true);
    }, []);

    useWebSocket(WS_URL, onWebSocketMessage);
    
    if (!hasData) {
        return(
            <div className="status-display">
                <div className="container">
                    <h4>Status Display</h4>
                    <p>No data available</p>
                </div>
            </div>
        );
    }

    let color;
    if(mode === "AUTO"){
        color = "green";
    }
    else if(mode === "MANUAL"){
        color = "yellow";
    }
    else{
        color = "red";
    }

    return(
        <div className="status-display">
            <div className="container" >
                <h4>Status Display</h4>
                <div className="status-indicator">
                    <div className="status-dot" style={{ backgroundColor: color }}></div>
                    <p className="status-text">{mode}</p>
                </div>
            </div>
        </div>
    );
}