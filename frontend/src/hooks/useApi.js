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
                    // Handle different HTTP error codes with user-friendly messages
                    if (response.status === 404) {
                        throw new Error('NO_DATA');
                    } else if (response.status === 400) {
                        throw new Error('NO_DATA');
                    } else if (response.status >= 500) {
                        throw new Error('SERVER_ERROR');
                    } else {
                        throw new Error('REQUEST_ERROR');
                    }
                }
                const result = await response.json();
                const finalData = transform ? transform(result) : result;
                setData(finalData);
                setError(null);
            } catch (err) {
                if (err.message === 'NO_DATA' || err.message === 'SERVER_ERROR' || err.message === 'REQUEST_ERROR') {
                    setError(err.message);
                } else {
                    setError('NETWORK_ERROR');
                }
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