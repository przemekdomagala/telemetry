import React, { useEffect, useState } from 'react';
import BoatVelocityHistoric from "./BoatVelocityHistoric";
import BatteriesHistoric from "./BatteriesHistoric";
import MapHistoric from "./MapHistoric";
import BoatModeHistoric from './BoatModeHistorix';
import ThrustersHistoric from './ThrustersHistoric';
import AccelerationHistoric from './AccelerationHistoric';
import useApi from '../../hooks/useApi';
import { exportAllData } from '../../utils/csvExport';
import '../../css/styles.css';

const TIME_URL = `${import.meta.env.VITE_API_URL}/data-time-range`;
const POSITION_URL = `${import.meta.env.VITE_API_URL}/position`;
const BATTERY_URL = `${import.meta.env.VITE_API_URL}/battery`;
const MODE_URL = `${import.meta.env.VITE_API_URL}/mode`;
const THRUSTERS_URL = `${import.meta.env.VITE_API_URL}/thrusters_input`;
const ACCELERATION_URL = `${import.meta.env.VITE_API_URL}/acceleration`;
const OBSTACLE_URL = `${import.meta.env.VITE_API_URL}/obstacle`;

function HistoricData() {
  const { data: timeRangeData, isLoading, error } = useApi(TIME_URL);
  const [dataRange, setDataRange] = useState(null);
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const buildApiUrl = (baseUrl, start, end) => {
    if (!start || !end) return null;
    const startDate = new Date(start).toISOString();
    const endDate = new Date(end).toISOString();
    return `${baseUrl}?start_ts=${startDate}&end_ts=${endDate}&limit=50000`;
  };

  const positionUrl = buildApiUrl(POSITION_URL, selectedStart, selectedEnd);
  const batteryUrl = buildApiUrl(BATTERY_URL, selectedStart, selectedEnd);
  const modeUrl = buildApiUrl(MODE_URL, selectedStart, selectedEnd);
  const thrustersUrl = buildApiUrl(THRUSTERS_URL, selectedStart, selectedEnd);
  const accelerationUrl = buildApiUrl(ACCELERATION_URL, selectedStart, selectedEnd);
  const obstacleUrl = buildApiUrl(OBSTACLE_URL, selectedStart, selectedEnd);

  const { data: positionData } = useApi(positionUrl || '', { dependencies: [selectedStart, selectedEnd] });
  const { data: batteryData } = useApi(batteryUrl || '', { dependencies: [selectedStart, selectedEnd] });
  const { data: modeData } = useApi(modeUrl || '', { dependencies: [selectedStart, selectedEnd] });
  const { data: thrustersData } = useApi(thrustersUrl || '', { dependencies: [selectedStart, selectedEnd] });
  const { data: accelerationData } = useApi(accelerationUrl || '', { dependencies: [selectedStart, selectedEnd] });
  const { data: obstacleData } = useApi(obstacleUrl || '', { dependencies: [selectedStart, selectedEnd] });

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

  const handleExportData = () => {
    setIsExporting(true);
    
    const allData = {
      position: positionData,
      battery: batteryData,
      mode: modeData,
      thrusters: thrustersData,
      acceleration: accelerationData,
      obstacle: obstacleData
    };

    exportAllData(allData, selectedStart, selectedEnd);
    
    setTimeout(() => setIsExporting(false), 1000);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '...';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDateInput = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeInput = (timestamp) => {
    if (!timestamp) return '00:00';
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
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

    let options = allOptions;
    
    if (startDateStr === endDateStr) {
      const startTime = formatTimeInput(selectedStart);
      options = options.filter(time => time > startTime);
    }
    
    if (dataRange && endDateStr === formatDateInput(dataRange.newest)) {
        const maxTime = formatTimeInput(dataRange.newest);
        options = options.filter(time => time <= maxTime);
    }

    return options;
  };

  const handleStartDateChange = (e) => {
    const dateStr = e.target.value;
    const timeStr = formatTimeInput(selectedStart);
    const [hours, minutes] = timeStr.split(':');
    const [year, month, day] = dateStr.split('-');
    const localDate = new Date(year, month - 1, day, hours, minutes);
    let finalStart = localDate.getTime();
    if (finalStart < dataRange.oldest) finalStart = dataRange.oldest;
    if (finalStart > dataRange.newest) finalStart = dataRange.newest;
    setSelectedStart(finalStart);
    if (finalStart >= selectedEnd) {
      setSelectedEnd(Math.min(finalStart + (5 * 60 * 1000), dataRange.newest));
    }
  };

  const handleStartTimeChange = (e) => {
    const timeStr = e.target.value;
    const dateStr = formatDateInput(selectedStart);
    const [hours, minutes] = timeStr.split(':');
    const [year, month, day] = dateStr.split('-');
    const localDate = new Date(year, month - 1, day, hours, minutes);
    const newStart = localDate.getTime();
    if (newStart >= dataRange.oldest && newStart <= dataRange.newest) {
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
    const localDate = new Date(year, month - 1, day, hours, minutes);
    let newEnd = localDate.getTime();
    if (newEnd > dataRange.newest) newEnd = dataRange.newest;
    if (newEnd < dataRange.oldest) newEnd = dataRange.oldest;
    if (newEnd <= selectedStart) {
      newEnd = Math.min(selectedStart + (5*60*1000), dataRange.newest);
    }
    setSelectedEnd(newEnd);
  };

  const handleEndTimeChange = (e) => {
    const timeStr = e.target.value;
    const dateStr = formatDateInput(selectedEnd);
    const [hours, minutes] = timeStr.split(':');
    const [year, month, day] = dateStr.split('-');
    const localDate = new Date(year, month - 1, day, hours, minutes);
    const newEnd = localDate.getTime();
    if (newEnd > selectedStart && newEnd <= dataRange.newest) {
      setSelectedEnd(newEnd);
    }
  };

  const setTimeWindow = (minutes) => {
    if (!dataRange || !selectedEnd) return;
    const windowMs = minutes * 60 * 1000;
    
    const newStart = selectedEnd - windowMs;
    
    setSelectedStart(Math.max(newStart, dataRange.oldest));
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
              <button 
                onClick={handleExportData} 
                className="time-window-btn export-btn"
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Export to CSV'}
              </button>
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

          <div className="historic-grid">
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

            <ThrustersHistoric
              selectedStart={selectedStart}
              selectedEnd={selectedEnd}
            />

            <AccelerationHistoric
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