import { useState, useEffect, useCallback, useRef } from 'react';
import { slotApi } from '../services/api';
import type { Slot } from '../types';

interface UseSlotsOptions {
  doctorId: string;
  date?: string;
  pollingInterval?: number; // in milliseconds, 0 to disable
}

export function useSlots({ doctorId, date, pollingInterval = 10000 }: UseSlotsOptions) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number>();

  const fetchSlots = useCallback(async () => {
    if (!doctorId) return;
    
    try {
      const data = await slotApi.getByDoctor(doctorId, { date, available_only: true });
      setSlots(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch slots';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId, date]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchSlots();
  }, [fetchSlots]);

  // Polling for real-time updates
  useEffect(() => {
    if (pollingInterval > 0) {
      intervalRef.current = window.setInterval(fetchSlots, pollingInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchSlots, pollingInterval]);

  return { slots, isLoading, error, refetch: fetchSlots };
}

