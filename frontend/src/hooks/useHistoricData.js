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
        
        const startDate = new Date(selectedStart).toISOString();
        const endDate = new Date(selectedEnd).toISOString();
        
        const params = `start_ts=${startDate}&end_ts=${endDate}&limit=50000`;
        const separator = endpoint.includes('?') ? '&' : '?';
        return `${endpoint}${separator}${params}`;
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
