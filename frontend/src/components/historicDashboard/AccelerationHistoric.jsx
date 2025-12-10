import { useEffect, useRef, useState } from 'react';
import useHistoricData from '../../hooks/useHistoricData';
import useCanvasPlot from '../../hooks/useCanvasPlot';

const API_URL = `${import.meta.env.VITE_API_URL}/acceleration`;

export default function AccelerationHistoric({ selectedStart, selectedEnd }) {
    const canvasRef = useRef(null);
    
    const { filteredData, isLoading, error, data: allData } = useHistoricData(
        API_URL,
        selectedStart,
        selectedEnd,
        point => point.acceleration
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
    }, []);

    useCanvasPlot(canvasRef, filteredData, {
        selectedStart,
        selectedEnd,
        yAxisLabel: 'Acceleration',
        yAxisUnit: 'm/s²',
        yAxisMin: -5,
        yAxisMax: 5,
        yAxisStep: 2,
        lineColor: '#00bcd4',
        pointColor: '#00bcd4',
        legendText: 'Acceleration',
        legendColor: '#00bcd4',
        showPoints: true,
        pointRadius: 1,
        canvasSize
    });

    return (
        <div className="historic-card">
            <h2 className="historic-title">Acceleration Over Time</h2>
            {isLoading && <div className="loading-message">Loading acceleration data...</div>}
            {error && <div className="error-message">Error loading data: {error}</div>}
            {!isLoading && !error && allData && allData.length === 0 && (
                <div className="empty-message">No historic acceleration data found.</div>
            )}
            {!isLoading && !error && filteredData && filteredData.length > 0 && (
                <div className="chart-info">
                    <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="historic-canvas"></canvas>
                </div>
            )}
            {!isLoading && !error && allData && allData.length > 0 && filteredData.length === 0 && (
                <div className="empty-message">No data in selected time range.</div>
            )}
        </div>
    );
}
