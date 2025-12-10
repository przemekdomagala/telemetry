import { useEffect, useRef, useState } from 'react';
import useHistoricData from '../../hooks/useHistoricData';

const API_URL = `${import.meta.env.VITE_API_URL}/thrusters_input`;

export default function ThrustersHistoric({ selectedStart, selectedEnd }) {
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

        const yAxisMin = -100;
        const yAxisMax = 100;
        const valueRange = yAxisMax - yAxisMin;

        // Draw grid and Y-axis labels
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 0.5;
        const yAxisStep = 20;
        for (let i = yAxisMin; i <= yAxisMax; i += yAxisStep) {
            const y = height - 60 - ((i - yAxisMin) / valueRange) * (height - 80);
            ctx.beginPath();
            ctx.moveTo(60, y);
            ctx.lineTo(width - 20, y);
            ctx.stroke();

            ctx.fillStyle = '#aaa';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${i} %`, 55, y + 4);
        }

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

        // Draw thruster lines
        const maxGapMs = 5000; 
        
        const drawLine = (dataKey, color, label) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            filteredData.forEach((point, index) => {
                const timestamp = new Date(point.timestamp).getTime();
                const value = point[dataKey] || 0;
                
                const x = 60 + ((timestamp - selectedStart) / duration) * (width - 80);
                const y = height - 60 - ((value - yAxisMin) / valueRange) * (height - 80);

                if (index === 0) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                } else {
                    const prevTimestamp = new Date(filteredData[index - 1].timestamp).getTime();
                    const timeDiff = timestamp - prevTimestamp;
                    
                    if (timeDiff > maxGapMs) {
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                if (index === filteredData.length - 1) {
                    ctx.stroke();
                }
            });
        };

        drawLine('left_thruster', '#ff0000', 'Left');
        drawLine('right_thruster', '#00ff00', 'Right');

        // Draw legend
        const legendData = [
            { color: '#ff0000', label: 'Left Thruster' },
            { color: '#00ff00', label: 'Right Thruster' }
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
            <h2 className="historic-title">Thrusters Input Over Time</h2>
            {isLoading && <div className="loading-message">Loading thrusters input data...</div>}
            {error && <div className="error-message">Error loading data: {error}</div>}
            {!isLoading && !error && allData && allData.length === 0 && (
                <div className="empty-message">No historic thrusters input data found.</div>
            )}
            {!isLoading && !error && filteredData && filteredData.length > 0 && (
                <div className="chart-info">
                    <canvas ref={canvasRef} className="historic-canvas"></canvas>
                </div>
            )}
        </div>
    );
}
