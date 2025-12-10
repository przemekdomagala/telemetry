import { useMemo } from 'react';
import useApi from './useApi';

/**
 * Hook to fetch and filter historic data based on time range
 * Automatically switches to aggregated endpoints for longer time ranges
 * @param {string} endpoint - API endpoint to fetch data from (e.g., '/position')
 * @param {number} selectedStart - Start timestamp in milliseconds
 * @param {number} selectedEnd - End timestamp in milliseconds
 * @param {function} valueExtractor - Function to extract the value from each data point (e.g., point => point.velocity)
 * @returns {object} { data, filteredData, isLoading, error }
 */
const useHistoricData = (endpoint, selectedStart, selectedEnd, valueExtractor = null) => {
    const apiUrl = useMemo(() => {
        if (!selectedStart || !selectedEnd) return endpoint;
        
        const durationHours = (selectedEnd - selectedStart) / (1000 * 60 * 60);
        const startDate = new Date(selectedStart).toISOString();
        const endDate = new Date(selectedEnd).toISOString();
        
        let url = endpoint;
        let params = `start_ts=${startDate}&end_ts=${endDate}`;
        
        if (durationHours > 6) {
            // > 6 hours: aggregate to 15-minute intervals (~24-96 points)
            url = `${endpoint}/aggregated`;
            params += `&interval=15 minutes`;
        } else if (durationHours > 2) {
            // 2-6 hours: aggregate to 5-minute intervals (~24-72 points)
            url = `${endpoint}/aggregated`;
            params += `&interval=5 minutes`;
        } else if (durationHours > 1.0) {
            // 1-2 hours: aggregate to 1-minute intervals (~60-120 points)
            url = `${endpoint}/aggregated`;
            params += `&interval=1 minute`;
        } else {
            // < 1 hour: use raw data with high limit
            params += `&limit=50000`;
        }
        
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}${params}`;
    }, [endpoint, selectedStart, selectedEnd]);

    const { data: allData, isLoading, error } = useApi(apiUrl, {
        dependencies: [selectedStart, selectedEnd]
    });

    const filteredData = useMemo(() => {
        if (!allData) return [];
        
        return allData;
    }, [allData]);

    const processedData = useMemo(() => {
        if (!filteredData.length || !valueExtractor) return filteredData;
        
        return filteredData.map(point => ({
            timestamp: new Date(point.timestamp).getTime(),
            value: valueExtractor(point),
            original: point
        }));
    }, [filteredData, valueExtractor]);

    return { 
        data: allData,
        filteredData: valueExtractor ? processedData : filteredData,
        isLoading, 
        error 
    };
};

export default useHistoricData;
