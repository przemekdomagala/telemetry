import React from 'react';
import useApi from '../../hooks/useApi';

const API_URL = `${import.meta.env.VITE_API_URL}/velocity`;

function BoatVelocityHistoric() {
    
    const { data: historicData, isLoading, error } = useApi(API_URL);

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

    if (!historicData || historicData.length === 0) {
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