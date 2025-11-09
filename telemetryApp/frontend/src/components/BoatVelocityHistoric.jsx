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
                setError(null); // Clear any previous errors
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
        return <p>Loading boat velocity historic data...</p>;
    }

    if (error) {
        return <p>Error loading data: **{error}**</p>;
    }

    if (historicData.length === 0) {
        return <p>No historic velocity data found.</p>;
    }

    return (
        <div>
            <h2>⛵ Boat Velocity Historic Data</h2>
            <table>
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Velocity (knots)</th>
                    </tr>
                </thead>
                <tbody>
                    {historicData.map((entry, index) => (
                        <tr key={index}>
                            <td>{new Date(entry.timestamp).toLocaleString()}</td>
                            <td>**{entry.velocity}**</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default BoatVelocityHistoric;