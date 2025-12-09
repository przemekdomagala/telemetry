import { useEffect, useRef, useState } from 'react';
import useHistoricData from '../../hooks/useHistoricData';

const API_URL = `${import.meta.env.VITE_API_URL}/mode`;

export default function BoatModeHistoric({ selectedStart, selectedEnd }) {
    const canvasRef = useRef(null);
    
    const { filteredData, isLoading, error, data: allData } = useHistoricData(
        API_URL,
        selectedStart,
        selectedEnd
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

    useEffect(() => {
        if (!filteredData || filteredData.length === 0 || !canvasRef.current || !selectedStart || !selectedEnd) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvasSize.width;
        const height = canvasSize.height;

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        // Mode colors
        const modeColors = {
            'MANUAL': '#ffff00',  // Yellow
            'AUTO': '#00ff00',     // Green
            'OFF': '#ff0000'       // Red
        };

        // Draw grid and Y-axis labels
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 0.5;
        const modes = ['MANUAL', 'AUTO', 'OFF'];
        const modeValues = { 'MANUAL': 0, 'AUTO': 1, 'OFF': 2 };
        
        modes.forEach((mode, index) => {
            const y = height - 60 - (index / 2) * (height - 80);
            ctx.beginPath();
            ctx.moveTo(60, y);
            ctx.lineTo(width - 20, y);
            ctx.stroke();

            ctx.fillStyle = '#aaa';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(mode, 55, y + 4);
        });

        // Draw X-axis time labels
        ctx.fillStyle = '#aaa';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        
        const duration = selectedEnd - selectedStart;
        const numLabels = 6;
        for (let i = 0; i <= numLabels; i++) {
            const time = selectedStart + (duration / numLabels) * i;
            const x = 60 + ((width - 80) / numLabels) * i;
            const date = new Date(time);
            const timeStr = date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false,
                timeZone: 'UTC'
            });
            ctx.fillText(timeStr, x, height - 35);
        }

        // Draw mode segments with colors
        ctx.lineWidth = 3;
        
        filteredData.forEach((point, index) => {
            if (index === filteredData.length - 1) return; // Skip last point
            
            const timestamp = new Date(point.timestamp).getTime();
            const nextTimestamp = new Date(filteredData[index + 1].timestamp).getTime();
            const mode = point.mode;
            const modeValue = modeValues[mode] || 0;
            
            const x1 = 60 + ((timestamp - selectedStart) / duration) * (width - 80);
            const x2 = 60 + ((nextTimestamp - selectedStart) / duration) * (width - 80);
            const y = height - 60 - (modeValue / 2) * (height - 80);

            ctx.strokeStyle = modeColors[mode] || '#ffffff';
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();

            // Draw circle at transition point
            ctx.fillStyle = modeColors[mode] || '#ffffff';
            ctx.beginPath();
            ctx.arc(x1, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw last point
        if (filteredData.length > 0) {
            const lastPoint = filteredData[filteredData.length - 1];
            const timestamp = new Date(lastPoint.timestamp).getTime();
            const mode = lastPoint.mode;
            const modeValue = modeValues[mode] || 0;
            
            const x = 60 + ((timestamp - selectedStart) / duration) * (width - 80);
            const y = height - 60 - (modeValue / 2) * (height - 80);

            ctx.fillStyle = modeColors[mode] || '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw legend
        const legendData = [
            { color: '#ffff00', label: 'MANUAL' },
            { color: '#00ff00', label: 'AUTO' },
            { color: '#ff0000', label: 'OFF' }
        ];

        legendData.forEach((item, index) => {
            const legendX = width - 150;
            const legendY = 30 + (index * 20);
            
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(legendX, legendY);
            ctx.lineTo(legendX + 20, legendY);
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, legendX + 30, legendY + 4);
        });

    }, [filteredData, selectedStart, selectedEnd, canvasSize]);

    return (
        <div className="historic-card">
            <h2 className="historic-title">Boat Mode Over Time</h2>
            {isLoading && <div className="loading-message">Loading boat mode data...</div>}
            {error && <div className="error-message">Error loading data: {error}</div>}
            {!isLoading && !error && allData && allData.length === 0 && (
                <div className="empty-message">No historic boat mode data found.</div>
            )}
            {!isLoading && !error && filteredData && filteredData.length > 0 && (
                <div className="chart-info">
                    <canvas ref={canvasRef} className="historic-canvas"></canvas>
                </div>
            )}
        </div>
    );
}