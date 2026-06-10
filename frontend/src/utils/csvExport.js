/**
 * Convert data to CSV format and trigger download
 * @param {Array} data - Array of data objects
 * @param {string} filename - Name of the CSV file
 * @param {Array} columns - Array of column definitions { key, label }
 */
export const exportToCSV = (data, filename, columns) => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Create CSV header
    const headers = columns.map(col => col.label).join(',');
    
    // Create CSV rows
    const rows = data.map(item => {
        return columns.map(col => {
            let value = item[col.key];
            
            // Format timestamp if it's a date
            if (col.key === 'timestamp' && value) {
                value = new Date(value).toISOString();
            }
            
            // Handle values that might contain commas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            
            return value ?? '';
        }).join(',');
    }).join('\n');

    // Combine header and rows
    const csv = `${headers}\n${rows}`;

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
};

/**
 * Export all data merged by timestamp into a single CSV
 * @param {Object} allData - Object containing different data types
 * @param {number} selectedStart - Start timestamp
 * @param {number} selectedEnd - End timestamp
 */
export const exportAllData = (allData, selectedStart, selectedEnd) => {
    const formatDate = (timestamp) => new Date(timestamp).toISOString().replace(/[:.]/g, '-').split('T')[0];
    const dateRange = `${formatDate(selectedStart)}_to_${formatDate(selectedEnd)}`;

    // Create a map to merge all data by timestamp
    const mergedData = new Map();

    // Helper to add data to merged map
    const addToMerged = (dataArray, fields) => {
        if (!dataArray || dataArray.length === 0) return;
        
        dataArray.forEach(item => {
            const ts = new Date(item.timestamp).toISOString();
            
            if (!mergedData.has(ts)) {
                mergedData.set(ts, { timestamp: ts });
            }
            
            const entry = mergedData.get(ts);
            fields.forEach(field => {
                if (item[field] !== undefined) {
                    entry[field] = item[field];
                }
            });
        });
    };

    // Merge all data types
    addToMerged(allData.position, ['latitude', 'longitude', 'velocity', 'heading']);
    addToMerged(allData.battery, ['left_battery_voltage', 'right_battery_voltage', 'central_battery_voltage']);
    addToMerged(allData.mode, ['mode']);
    addToMerged(allData.thrusters, ['left_thruster', 'right_thruster']);
    addToMerged(allData.acceleration, ['acceleration']);
    addToMerged(allData.obstacle, ['obstacle_latitude', 'obstacle_longitude', 'obstacle_distance']);

    // Handle obstacles separately since they have duplicate field names
    if (allData.obstacle?.length > 0) {
        allData.obstacle.forEach(item => {
            const ts = new Date(item.timestamp).toISOString();
            
            if (!mergedData.has(ts)) {
                mergedData.set(ts, { timestamp: ts });
            }
            
            const entry = mergedData.get(ts);
            entry.obstacle_latitude = item.latitude;
            entry.obstacle_longitude = item.longitude;
            entry.obstacle_distance = item.distance;
        });
    }

    // Convert map to sorted array
    const sortedData = Array.from(mergedData.values()).sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Define all columns
    const columns = [
        { key: 'timestamp', label: 'Timestamp' },
        { key: 'latitude', label: 'Latitude' },
        { key: 'longitude', label: 'Longitude' },
        { key: 'velocity', label: 'Velocity (m/s)' },
        { key: 'heading', label: 'Heading (°)' },
        { key: 'left_battery_voltage', label: 'Left Battery (V)' },
        { key: 'right_battery_voltage', label: 'Right Battery (V)' },
        { key: 'central_battery_voltage', label: 'Central Battery (V)' },
        { key: 'mode', label: 'Mode' },
        { key: 'left_thruster', label: 'Left Thruster (%)' },
        { key: 'right_thruster', label: 'Right Thruster (%)' },
        { key: 'acceleration', label: 'Acceleration (m/s²)' },
        { key: 'obstacle_latitude', label: 'Obstacle Latitude' },
        { key: 'obstacle_longitude', label: 'Obstacle Longitude' },
        { key: 'obstacle_distance', label: 'Obstacle Distance (m)' }
    ];

    if (sortedData.length > 0) {
        exportToCSV(sortedData, `telemetry_data_${dateRange}`, columns);
    } else {
        console.warn('No data available to export');
    }
};
