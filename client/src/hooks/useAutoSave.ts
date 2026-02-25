import { useState, useEffect, useRef } from 'react';

interface UseAutoSaveOptions {
    delay?: number;
    enabled?: boolean;
}

export const useAutoSave = <T,>(
    data: T,
    saveFn: (data: T) => Promise<void>,
    options: UseAutoSaveOptions = {}
) => {
    const { delay = 2000, enabled = true } = options;
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Skip auto-save on first render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!enabled) return;

        const timer = setTimeout(async () => {
            setIsSaving(true);
            setError(null);
            try {
                await saveFn(data);
                setLastSaved(new Date());
            } catch (err) {
                setError(err as Error);
                console.error('Auto-save error:', err);
            } finally {
                setIsSaving(false);
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [data, delay, enabled]);

    return { isSaving, lastSaved, error };
};
