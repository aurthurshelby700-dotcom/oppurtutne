import { useState, useRef, useCallback } from 'react';

export function useScrollAware(timeout = 3000) {
    const [isScrolling, setIsScrolling] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const onScroll = useCallback(() => {
        setIsScrolling(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, timeout);
    }, [timeout]);

    return { isScrolling, onScroll };
}
