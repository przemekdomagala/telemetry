import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000/api/velocity';

function BoatVelocityHistoric() {
    const [historicData, setHistoricData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setHistoricData(data);
                setError(null); 
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        
        fetchData();

        const intervalId = setInterval(fetchData, 1000);

        return () => clearInterval(intervalId);
    }, []); 

    if (isLoading) {
        return (
            <div className="historic-card">
                <div className="loading-message">Loading boat velocity data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="historic-card">
                <div className="error-message">Error loading data: {error}</div>
            </div>
        );
    }

    if (historicData.length === 0) {
        return (
            <div className="historic-card">
                <div className="empty-message">No historic velocity data found.</div>
            </div>
        );
    }

    return (
        <div className="historic-card">
            <h2 className="historic-title">Boat Velocity Data</h2>
            <div className="table-wrapper">
                <table className="historic-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Velocity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historicData.map((entry, index) => (
                            <tr key={index}>
                                <td>{new Date(entry.timestamp).toLocaleString()}</td>
                                <td className="velocity-value">{entry.velocity} m/s</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default BoatVelocityHistoric;