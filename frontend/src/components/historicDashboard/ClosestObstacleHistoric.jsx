import { useEffect, useRef, useState } from 'react';
import useHistoricData from '../../hooks/useHistoricData';
import useCanvasPlot from '../../hooks/useCanvasPlot';

const API_URL = `${import.meta.env.VITE_API_URL}/obstacle`;

export default function ClosestObstacleHistoric({ selectedStart, selectedEnd }) {
    const canvasRef = useRef(null);
    
    const { filteredData: rawData, isLoading, error, data: allData } = useHistoricData(
        API_URL,
        selectedStart,
        selectedEnd,
        point => point.distance
    );

    // Filter out invalid distance values
    const filteredData = rawData?.filter(point => {
        const value = point.value || point.distance;
        return value !== null && value !== undefined && !isNaN(value) && value >= 0 && value < 1000;
    }) || [];

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
    }, []);

    useCanvasPlot(canvasRef, filteredData, {
        selectedStart,
        selectedEnd,
        yAxisLabel: 'Distance to Closest Obstacle',
        yAxisUnit: 'm',
        yAxisMin: 0,
        yAxisMax: 6,
        yAxisStep: 2,
        lineColor: '#ff4500',
        pointColor: '#ff4500',
        legendText: 'Closest Obstacle Distance',
        legendColor: '#ff4500',
        showPoints: true,
        pointRadius: 1,
        canvasSize
    });

    return (
        <div className="historic-card">
            <h2 className="historic-title">Closest Obstacle Distance Over Time</h2>
            {isLoading && <div className="loading-message">Loading closest obstacle data...</div>}
            {error && <div className="error-message">Error loading data: {error}</div>}
            {!isLoading && !error && allData && allData.length === 0 && (
                <div className="empty-message">No historic closest obstacle data found.</div>
            )}
            {!isLoading && !error && filteredData && filteredData.length > 0 && (
                <div className="chart-info">
                    <canvas ref={canvasRef} width={800} height={400} className="historic-canvas"></canvas>
                </div>
            )}
        </div>
    );
}