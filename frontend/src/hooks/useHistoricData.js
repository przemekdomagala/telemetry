import { useMemo } from 'react';
import useApi from './useApi';

/**
 * Hook to fetch and filter historic data based on time range
 * @param {string} endpoint - API endpoint to fetch data from
 * @param {number} selectedStart - Start timestamp in milliseconds
 * @param {number} selectedEnd - End timestamp in milliseconds
 * @param {function} valueExtractor - Function to extract the value from each data point (e.g., point => point.velocity)
 * @returns {object} { data, filteredData, isLoading, error }
 */
const useHistoricData = (endpoint, selectedStart, selectedEnd, valueExtractor = null) => {
    const { data: allData, isLoading, error } = useApi(endpoint);

    const filteredData = useMemo(() => {
        if (!allData || !selectedStart || !selectedEnd) return [];
        
        return allData.filter(point => {
            const timestamp = new Date(point.timestamp).getTime();
            return timestamp >= selectedStart && timestamp <= selectedEnd;
        });
    }, [allData, selectedStart, selectedEnd]);

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
