import { useEffect, useState } from "react";

const useApi = url => {
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
                setData(result);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();

        const intervalId = setInterval(fetchData, 1000);

        return () => clearInterval(intervalId);
    }, [url]);

    return { data, isLoading, error };
}

export default useApi;