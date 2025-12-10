import { useEffect } from 'react';

/**
 * Hook for plotting time series data on a canvas
 * @param {object} canvasRef - React ref to the canvas element
 * @param {array} data - Array of data points with timestamp and value
 * @param {object} config - Configuration object for the plot
 */
const useCanvasPlot = (canvasRef, data, config = {}) => {
    const {
        selectedStart,
        selectedEnd,
        yAxisLabel = 'Value',
        yAxisUnit = '',
        yAxisMin = 0,
        yAxisMax = null, 
        yAxisStep = 2,
        gridColor = '#2a2a2a',
        lineColor = '#00ff00',
        lineWidth = 2,
        showPoints = true,
        pointRadius = 2,
        pointColor = '#00ff00',
        legendText = 'Data',
        legendColor = '#00ff00'
    } = config;

    useEffect(() => {
        if (!data || data.length === 0 || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        const values = data.map(p => p.value || p.velocity || 0);
        const maxValue = yAxisMax !== null ? yAxisMax : Math.max(yAxisMin + yAxisStep, ...values);
        const minValue = yAxisMin;
        const valueRange = maxValue - minValue;

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 0.5;
        for (let i = minValue; i <= maxValue; i += yAxisStep) {
            const y = height - 60 - ((i - minValue) / valueRange) * (height - 80);
            ctx.beginPath();
            ctx.moveTo(60, y);
            ctx.lineTo(width - 20, y);
            ctx.stroke();

            ctx.fillStyle = '#aaa';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${i.toFixed(1)} ${yAxisUnit}`, 55, y + 4);
        }

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

        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;

        const maxGapMs = 5000;

        data.forEach((point, index) => {
            const timestamp = point.timestamp || new Date(point.timestamp).getTime();
            const value = point.value || point.velocity || 0;
            
            const x = 60 + ((timestamp - selectedStart) / duration) * (width - 80);
            const y = height - 60 - ((value - minValue) / valueRange) * (height - 80);

            if (index === 0) {
                ctx.beginPath();
                ctx.moveTo(x, y);
            } else {
                const prevTimestamp = data[index - 1].timestamp || new Date(data[index - 1].timestamp).getTime();
                const timeDiff = timestamp - prevTimestamp;
                
                if (timeDiff > maxGapMs) {
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            if (index === data.length - 1) {
                ctx.stroke();
            }
        });

        // Draw data points
        if (showPoints) {
            ctx.fillStyle = pointColor;
            data.forEach(point => {
                const timestamp = point.timestamp || new Date(point.timestamp).getTime();
                const value = point.value || point.velocity || 0;
                
                const x = 60 + ((timestamp - selectedStart) / duration) * (width - 80);
                const y = height - 60 - ((value - minValue) / valueRange) * (height - 80);
                
                ctx.beginPath();
                ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Draw legend
        const legendX = width - 150;
        const legendY = 30;
        ctx.strokeStyle = legendColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(legendX, legendY);
        ctx.lineTo(legendX + 20, legendY);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(legendText, legendX + 30, legendY + 4);

    }, [data, selectedStart, selectedEnd, canvasRef, config]);
};

export default useCanvasPlot;
