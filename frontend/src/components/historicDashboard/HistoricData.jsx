import React, { useEffect, useState } from 'react';
import BoatVelocityHistoric from "./BoatVelocityHistoric";
import '../../css/Dashboard.css';

const TIME_URL = `${import.meta.env.VITE_API_URL}/data-time-range`;

function HistoricData() {
  const [dataRange, setDataRange] = useState(null);
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimeRange = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(TIME_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result && result.start_time && result.end_time) {
          const newest = new Date(result.end_time).getTime();
          const oldest = new Date(result.start_time).getTime();
          
          setDataRange({ oldest, newest });
          setSelectedStart(oldest);
          setSelectedEnd(newest);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeRange();
  }, []);

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleStartChange = (e) => {
    const newStart = parseInt(e.target.value);
    if (newStart < selectedEnd) {
      setSelectedStart(newStart);
    }
  };

  const handleEndChange = (e) => {
    const newEnd = parseInt(e.target.value);
    if (newEnd > selectedStart) {
      setSelectedEnd(newEnd);
    }
  };

  return (
    <div className="historic-page-container">
      <h1 className="page-title">Historic Data</h1>
      
      {isLoading && <div className="loading-message">Loading time range...</div>}
      {error && <div className="error-message">Error loading time range: {error}</div>}
      
      {!isLoading && !error && dataRange && (
        <>
          <div className="time-range-controls">
            <div className="time-range-info">
              <span>From: <strong>{formatDateTime(selectedStart)}</strong></span>
              <span>To: <strong>{formatDateTime(selectedEnd)}</strong></span>
            </div>
            <div className="slider-container">
              <label>Start Time:</label>
              <input
                type="range"
                min={dataRange.oldest}
                max={dataRange.newest}
                value={selectedStart}
                onChange={handleStartChange}
                className="time-slider"
              />
            </div>
            <div className="slider-container">
              <label>End Time:</label>
              <input
                type="range"
                min={dataRange.oldest}
                max={dataRange.newest}
                value={selectedEnd}
                onChange={handleEndChange}
                className="time-slider"
              />
            </div>
          </div>

          <BoatVelocityHistoric 
            selectedStart={selectedStart} 
            selectedEnd={selectedEnd} 
          />
        </>
      )}
    </div>
  );
}

export default HistoricData;