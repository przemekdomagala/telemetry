import { useEffect, useState } from "react";

const useApi = (url, options = {}) => {
    const { 
        interval = null, 
        dependencies = [], 
        transform = null 
    } = options;

    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                const finalData = transform ? transform(result) : result;
                setData(finalData);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();

        if (interval) {
            const intervalId = setInterval(fetchData, interval);
            return () => clearInterval(intervalId);
        }
    }, [url, interval, ...dependencies]);

    return { data, isLoading, error };
}

export default useApi;