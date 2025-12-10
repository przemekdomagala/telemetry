import React, { useState, useEffect, useRef, useCallback } from 'react';
import useWebSocket from '../../hooks/useWebSocket';

const WS_URL = `${import.meta.env.VITE_WS_URL}/battery`;
const TIME_WINDOW = 5 * 60 * 1000; 

function BatteryPlot() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const plotStartTimestampRef = useRef(null);
    
    const [batteryData, setBatteryData] = useState([]);
    const [hasData, setHasData] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const width = Math.min(containerWidth - 40, 800);
                const height = Math.max(width * 0.5, 300);
                setCanvasSize({ width, height });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const onWebSocketMessage = useCallback((data) => {
        const timestamp = new Date(data.timestamp).getTime();
        
        if (plotStartTimestampRef.current === null) {
            plotStartTimestampRef.current = timestamp;
        }

        const newDataPoint = {
            timestamp,
            left: data.left_battery_voltage,
            right: data.right_battery_voltage,
            central: data.central_battery_voltage
        };

        setBatteryData(prevData => {
            const cutoffTime = Date.now() - TIME_WINDOW;
            const filteredData = prevData.filter(point => point.timestamp > cutoffTime);
            return [...filteredData, newDataPoint];
        });

        setHasData(true);
    }, []);

    useWebSocket(WS_URL, onWebSocketMessage);

    useEffect(() => {
        if (batteryData.length === 0) {
            plotStartTimestampRef.current = null;
        }
    }, [batteryData.length]);

    useEffect(() => {
        if (!batteryData.length || !canvasRef.current || !plotStartTimestampRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = canvasSize.width * dpr;
        canvas.height = canvasSize.height * dpr;
        
        ctx.scale(dpr, dpr);
        
        const width = canvasSize.width;
        const height = canvasSize.height;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        const now = Date.now();
        const timeSinceStart = now - plotStartTimestampRef.current;
        
        let startTime;

        if (timeSinceStart < TIME_WINDOW) {
            startTime = plotStartTimestampRef.current;
        } else {
            startTime = now - TIME_WINDOW;
        }

        // Dynamic margins based on canvas size
        const marginLeft = width > 600 ? 60 : 40;
        const marginRight = width > 600 ? 20 : 10;
        const marginBottom = 60;
        const marginTop = 20;

        // Voltage range
        const allVoltages = batteryData.flatMap(d => [d.left, d.right, d.central]);
        const minVoltage = Math.floor(Math.min(...allVoltages));
        const maxVoltage = Math.ceil(Math.max(...allVoltages));
        const voltageRange = maxVoltage - minVoltage || 1;

        // Grid lines
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 0.5;
        const voltageStep = 1;
        for (let v = minVoltage; v <= maxVoltage; v += voltageStep) {
            const y = height - marginBottom - ((v - minVoltage) / voltageRange) * (height - marginBottom - marginTop);
            ctx.beginPath();
            ctx.moveTo(marginLeft, y);
            ctx.lineTo(width - marginRight, y);
            ctx.stroke();

            ctx.fillStyle = '#aaa';
            ctx.font = `${width > 600 ? 11 : 9}px sans-serif`;
            ctx.textAlign = 'right';
            ctx.fillText(`${v.toFixed(1)}V`, marginLeft - 5, y + 4);
        }

        // Time labels 
        ctx.fillStyle = '#aaa';
        ctx.font = `${width > 600 ? 11 : 9}px sans-serif`;
        ctx.textAlign = 'center';
        
        const numLabels = width > 600 ? 6 : 3;
        for (let i = 0; i <= numLabels; i++) {
            const time = startTime + (TIME_WINDOW / numLabels) * i;
            const x = marginLeft + ((width - marginLeft - marginRight) / numLabels) * i;
            const date = new Date(time);
            const timeStr = date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            ctx.fillText(timeStr, x, height - 35);
        }

        // Data lines
        const drawLine = (key, color) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            batteryData.forEach((point, index) => {
                const x = marginLeft + ((point.timestamp - startTime) / TIME_WINDOW) * (width - marginLeft - marginRight);
                const y = height - marginBottom - ((point[key] - minVoltage) / voltageRange) * (height - marginBottom - marginTop);

                if (x < marginLeft) return;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        };

        drawLine('left', '#ff0000');
        drawLine('right', '#00ff00');
        drawLine('central', '#ffff00');

        const legendX = width > 600 ? width - 180 : marginLeft;
        const legendY = width > 600 ? 20 : height - 25;
        const fontSize = width > 600 ? 12 : 10;
        const legendItems = [
            { label: 'Left', color: '#ff0000' },
            { label: 'Right', color: '#00ff00' },
            { label: 'Central', color: '#ffff00' }
        ];

        if (width > 600) {
            legendItems.forEach((item, i) => {
                const y = legendY + i * 20;
                
                ctx.strokeStyle = item.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(legendX, y);
                ctx.lineTo(legendX + 20, y);
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.font = `${fontSize}px sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText(item.label, legendX + 30, y + 4);
            });
        } else {
            const spacing = (width - 2 * marginLeft) / legendItems.length;
            legendItems.forEach((item, i) => {
                const x = legendX + i * spacing;
                
                ctx.strokeStyle = item.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, legendY);
                ctx.lineTo(x + 15, legendY);
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.font = `${fontSize}px sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText(item.label, x + 20, legendY + 4);
            });
        }

    }, [batteryData, canvasSize]);

    return (
        <div className="battery-plot" ref={containerRef}>
            <div className="container">
                {!hasData && <p>Waiting for battery data...</p>}
                {hasData && (
                    <canvas 
                        ref={canvasRef} 
                        width={canvasSize.width}
                        height={canvasSize.height}
                    ></canvas>
                )}
            </div>
        </div>
    );
}

export default BatteryPlot;