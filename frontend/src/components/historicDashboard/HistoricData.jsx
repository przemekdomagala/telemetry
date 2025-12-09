import React, { useEffect, useState } from 'react';
import BoatVelocityHistoric from "./BoatVelocityHistoric";
import BatteriesHistoric from "./BatteriesHistoric";
import MapHistoric from "./MapHistoric";
import BoatModeHistoric from './BoatModeHistorix';
import ThrustersHistoric from './ThrustersHistoric';
import ClosestObstacleHistoric from './ClosestObstacleHistoric';
import useApi from '../../hooks/useApi';
import '../../css/Dashboard.css';

const TIME_URL = `${import.meta.env.VITE_API_URL}/data-time-range`;

function HistoricData() {
  const { data: timeRangeData, isLoading, error } = useApi(TIME_URL);
  const [dataRange, setDataRange] = useState(null);
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);

  useEffect(() => {
    if (timeRangeData && timeRangeData.start_time && timeRangeData.end_time) {
      const newest = new Date(timeRangeData.end_time).getTime();
      const oldest = new Date(timeRangeData.start_time).getTime();
      
      setDataRange({ oldest, newest });
      const oneHourAgo = newest - (60 * 60 * 1000);
      const initialStart = Math.max(oldest, oneHourAgo);
      
      const roundToFiveMinutes = (timestamp) => {
        const date = new Date(timestamp);
        const minutes = date.getUTCMinutes();
        const roundedMinutes = Math.floor(minutes / 5) * 5;
        date.setUTCMinutes(roundedMinutes, 0, 0);
        return date.getTime();
      };
      
      setSelectedStart(roundToFiveMinutes(initialStart));
      setSelectedEnd(roundToFiveMinutes(newest));
    }
  }, [timeRangeData]);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '...';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }) + ' UTC';
  };

  const formatDateInput = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeInput = (timestamp) => {
    if (!timestamp) return '00:00';
    const date = new Date(timestamp);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        options.push(`${hourStr}:${minuteStr}`);
      }
    }
    return options;
  };

  // Filter Start Options based on Data Limits
  const getStartTimeOptions = () => {
    if (!dataRange || !selectedStart) return [];
    
    let options = generateTimeOptions();
    
    const currentDay = formatDateInput(selectedStart);
    const oldestDay = formatDateInput(dataRange.oldest);
    const newestDay = formatDateInput(dataRange.newest);

    if (currentDay === oldestDay) {
       const oldestTime = formatTimeInput(dataRange.oldest);
       options = options.filter(t => t >= oldestTime);
    }
    
    if (currentDay === newestDay) {
       const newestTime = formatTimeInput(dataRange.newest);
       options = options.filter(t => t <= newestTime);
    }
    
    return options;
  };

  const getEndTimeOptions = () => {
    if (!selectedStart || !selectedEnd) return [];

    const startDateStr = formatDateInput(selectedStart);
    const endDateStr = formatDateInput(selectedEnd);
    const allOptions = generateTimeOptions();

    if (startDateStr === endDateStr) {
      const startTime = formatTimeInput(selectedStart);
      return allOptions.filter(time => time > startTime);
    }
    
    if (dataRange && endDateStr === formatDateInput(dataRange.newest)) {
        const maxTime = formatTimeInput(dataRange.newest);
        return allOptions.filter(time => time <= maxTime);
    }

    return allOptions;
  };

  const handleStartDateChange = (e) => {
    const dateStr = e.target.value;
    const timeStr = formatTimeInput(selectedStart);
    const [hours, minutes] = timeStr.split(':');
    const [year, month, day] = dateStr.split('-');
    
    const newStart = Date.UTC(year, month - 1, day, hours, minutes);
    
    if (!isNaN(newStart)) {
      let finalStart = newStart;
      if (finalStart < dataRange.oldest) finalStart = dataRange.oldest;
      if (finalStart > dataRange.newest) finalStart = dataRange.newest;
      
      setSelectedStart(finalStart);
      
      if (finalStart >= selectedEnd) {
         setSelectedEnd(Math.min(finalStart + (60*60*1000), dataRange.newest));
      }
    }
  };

  const handleStartTimeChange = (e) => {
    const timeStr = e.target.value;
    const dateStr = formatDateInput(selectedStart);
    const [hours, minutes] = timeStr.split(':');
    const [year, month, day] = dateStr.split('-');
    
    const newStart = Date.UTC(year, month - 1, day, hours, minutes);
    
    console.log('Start time selected:', timeStr, 'Timestamp:', newStart, 'Date:', new Date(newStart).toISOString());

    if (!isNaN(newStart) && newStart >= dataRange.oldest && newStart <= dataRange.newest) {
      setSelectedStart(newStart);
      
      if (newStart >= selectedEnd) {
        const newEndCandidate = newStart + (5 * 60 * 1000); 
        setSelectedEnd(Math.min(newEndCandidate, dataRange.newest));
      }
    }
  };

  const handleEndDateChange = (e) => {
    const dateStr = e.target.value;
    const [year, month, day] = dateStr.split('-');
    
    const timeStr = formatTimeInput(selectedEnd);
    const [hours, minutes] = timeStr.split(':');
    
    let newEnd = Date.UTC(year, month - 1, day, hours, minutes);
    
    if (newEnd > dataRange.newest) newEnd = dataRange.newest;
    if (newEnd <= selectedStart) newEnd = selectedStart + (5*60*1000); 
    
    setSelectedEnd(newEnd);
  };

  const handleEndTimeChange = (e) => {
    const timeStr = e.target.value;
    const dateStr = formatDateInput(selectedEnd);
    const [hours, minutes] = timeStr.split(':');
    const [year, month, day] = dateStr.split('-');
    
    const newEnd = Date.UTC(year, month - 1, day, hours, minutes);
    
    if (!isNaN(newEnd) && newEnd > selectedStart && newEnd <= dataRange.newest) {
        setSelectedEnd(newEnd);
    }
  };

  const setTimeWindow = (minutes) => {
    if (!dataRange) return;
    const windowMs = minutes * 60 * 1000;
    const newEnd = dataRange.newest;
    const newStart = Math.max(dataRange.oldest, newEnd - windowMs);
    
    const roundToFiveMinutes = (timestamp) => {
      const date = new Date(timestamp);
      const mins = date.getUTCMinutes();
      const roundedMinutes = Math.floor(mins / 5) * 5;
      date.setUTCMinutes(roundedMinutes, 0, 0);
      return date.getTime();
    };
    
    setSelectedStart(roundToFiveMinutes(newStart));
    setSelectedEnd(roundToFiveMinutes(newEnd));
  };

  return (
    <div className="historic-page-container">
      <h1 className="page-title">Historic Data</h1>
      
      {isLoading && <div className="loading-message">Loading...</div>}
      {error && <div className="error-message">{error}</div>}
      
      {!isLoading && !error && dataRange && selectedStart && selectedEnd && (
        <>
          <div className="time-range-controls">
            <div className="time-window-buttons">
              <button onClick={() => setTimeWindow(60)} className="time-window-btn">Last 1h</button>
              <button onClick={() => setTimeWindow(6 * 60)} className="time-window-btn">Last 6h</button>
              <button onClick={() => setTimeWindow(24 * 60)} className="time-window-btn">Last 24h</button>
              <button onClick={() => {
                  setSelectedStart(dataRange.oldest);
                  setSelectedEnd(dataRange.newest);
              }} className="time-window-btn">Full Range</button>
            </div>
            
            <div className="time-range-info">
              <span>From: <strong>{formatDateTime(selectedStart)}</strong></span>
              <span>To: <strong>{formatDateTime(selectedEnd)}</strong></span>
              <span>Duration: <strong>{((selectedEnd - selectedStart) / 60000).toFixed(1)} min</strong></span>
            </div>

            <div className="datetime-picker-container">
              <div className="datetime-input-group">
                <label>Start:</label>
                <div className="date-time-inputs">
                  <input
                    type="date"
                    min={formatDateInput(dataRange.oldest)}
                    max={formatDateInput(dataRange.newest)}
                    value={formatDateInput(selectedStart)}
                    onChange={handleStartDateChange}
                    className="date-input"
                  />
                  <select
                    value={formatTimeInput(selectedStart)}
                    onChange={handleStartTimeChange}
                    className="time-select"
                  >
                    {getStartTimeOptions().map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="datetime-input-group">
                <label>End:</label>
                <div className="date-time-inputs">
                  <input
                    type="date"
                    min={formatDateInput(selectedStart)} 
                    max={formatDateInput(dataRange.newest)}
                    value={formatDateInput(selectedEnd)}
                    onChange={handleEndDateChange}
                    className="date-input"
                  />
                  <select
                    value={formatTimeInput(selectedEnd)}
                    onChange={handleEndTimeChange}
                    className="time-select"
                  >
                    {getEndTimeOptions().map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <BoatVelocityHistoric 
              selectedStart={selectedStart} 
              selectedEnd={selectedEnd} 
            />

            <BatteriesHistoric 
              selectedStart={selectedStart} 
              selectedEnd={selectedEnd} 
            />

            <BoatModeHistoric
              selectedStart={selectedStart}
              selectedEnd={selectedEnd}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <ThrustersHistoric
              selectedStart={selectedStart}
              selectedEnd={selectedEnd}
            />

            <ClosestObstacleHistoric
              selectedStart={selectedStart}
              selectedEnd={selectedEnd}
            />

            <MapHistoric 
              selectedStart={selectedStart} 
              selectedEnd={selectedEnd} 
            />
          </div>
        </>
      )}
    </div>
  );
}

export default HistoricData;