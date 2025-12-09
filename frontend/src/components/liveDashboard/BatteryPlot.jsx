import React, { useState, useEffect, useRef, useCallback } from 'react';
import useWebSocket from '../../hooks/useWebSocket';

const WS_URL = `${import.meta.env.VITE_WS_URL}/battery`;
const TIME_WINDOW = 5 * 60 * 1000; 

function BatteryPlot() {
    const canvasRef = useRef(null);
    const plotStartTimestampRef = useRef(null);
    
    const [batteryData, setBatteryData] = useState([]);
    const [hasData, setHasData] = useState(false);

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
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;

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
            const y = height - 60 - ((v - minVoltage) / voltageRange) * (height - 80);
            ctx.beginPath();
            ctx.moveTo(60, y);
            ctx.lineTo(width - 20, y);
            ctx.stroke();

            ctx.fillStyle = '#aaa';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${v.toFixed(1)}V`, 55, y + 4);
        }

        // Time labels
        ctx.fillStyle = '#aaa';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        
        const numLabels = 6;
        for (let i = 0; i <= numLabels; i++) {
            const time = startTime + (TIME_WINDOW / numLabels) * i;
            const x = 60 + ((width - 80) / numLabels) * i;
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
                // Calculate X based on the dynamic startTime
                const x = 60 + ((point.timestamp - startTime) / TIME_WINDOW) * (width - 80);
                const y = height - 60 - ((point[key] - minVoltage) / voltageRange) * (height - 80);

                // Prevent drawing lines backward/messy if data is slightly out of sync
                if (x < 60) return; 

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
        };

        // Draw lines for each battery
        drawLine('left', '#ff0000');      // Red for left
        drawLine('right', '#00ff00');     // Green for right
        drawLine('central', '#ffff00');   // Yellow for central

        // Draw legend
        const legendX = width - 180;
        const legendY = 20;
        const legendItems = [
            { label: 'Left Battery', color: '#ff0000' },
            { label: 'Right Battery', color: '#00ff00' },
            { label: 'Central Battery', color: '#ffff00' }
        ];

        legendItems.forEach((item, i) => {
            const y = legendY + i * 20;
            
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(legendX, y);
            ctx.lineTo(legendX + 20, y);
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, legendX + 30, y + 4);
        });

    }, [batteryData]);

    return (
        <div className="battery-plot">
            <div className="container">
                <h4>Battery Voltages</h4>
                {!hasData && <p>Waiting for battery data...</p>}
                {hasData && (
                    <>
                        <canvas 
                            ref={canvasRef} 
                            style={{ 
                                width: '800px', 
                                height: '400px', 
                                border: '1px solid #333' 
                            }}
                        ></canvas>
                    </>
                )}
            </div>
        </div>
    );
}

export default BatteryPlot;