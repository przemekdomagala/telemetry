import { useEffect, useRef, useState } from 'react';
import useHistoricData from '../../hooks/useHistoricData';
import useCanvasPlot from '../../hooks/useCanvasPlot';

const API_URL = `${import.meta.env.VITE_API_URL}/position`;

function BoatVelocityHistoric({ selectedStart, selectedEnd }) {
    const canvasRef = useRef(null);
    
    const { filteredData, isLoading, error, data: allData } = useHistoricData(
        API_URL,
        selectedStart,
        selectedEnd,
        point => point.velocity
    );

    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current?.parentElement) {
                const containerWidth = canvasRef.current.parentElement.offsetWidth;
                const width = Math.min(containerWidth - 40, 800);
                const height = Math.max(width * 0.5, 300);
                setCanvasSize({ width, height });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [canvasRef]);

    useCanvasPlot(canvasRef, filteredData, {
        selectedStart,
        selectedEnd,
        yAxisLabel: 'Velocity',
        yAxisUnit: 'm/s',
        yAxisMin: 0,
        yAxisMax: null, // Auto-calculate
        yAxisStep: 2,
        lineColor: '#ffff00',
        pointColor: '#ffff00',
        legendText: 'Boat Velocity',
        legendColor: '#ffff00',
        showPoints: false,
        canvasSize
    });

    return (
        <div className="historic-card">
            <h2 className="historic-title">Boat Velocity Over Time</h2>
            {isLoading && <div className="loading-message">Loading boat velocity data...</div>}
            {error && <div className="error-message">Error loading data: {error}</div>}
            {!isLoading && !error && allData && allData.length === 0 && (
                <div className="empty-message">No historic velocity data found.</div>
            )}
            {!isLoading && !error && filteredData && filteredData.length > 0 && (
                <div className="chart-info">
                    <canvas ref={canvasRef} width={800} height={400} className="historic-canvas"></canvas>
                </div>
            )}
            {!isLoading && !error && allData && allData.length > 0 && filteredData.length === 0 && (
                <div className="empty-message">No data in selected time range.</div>
            )}
        </div>
    );
}

export default BoatVelocityHistoric;