import { useState, useEffect, useCallback } from 'react';
import { doctorApi } from '../services/api';
import type { Doctor, Pagination } from '../types';

interface UseDoctorsOptions {
  specialization?: string;
  page?: number;
  limit?: number;
}

interface UseDoctorsReturn {
  doctors: Doctor[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDoctors(options: UseDoctorsOptions = {}): UseDoctorsReturn {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await doctorApi.getAll(options);
      setDoctors(response.data);
      setPagination(response.pagination || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch doctors';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [options.specialization, options.page, options.limit]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, pagination, isLoading, error, refetch: fetchDoctors };
}

export function useDoctor(id: string | undefined) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchDoctor = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await doctorApi.getById(id);
        setDoctor(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch doctor';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctor();
  }, [id]);

  return { doctor, isLoading, error };
}

export function useSpecializations() {
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    doctorApi.getSpecializations()
      .then(setSpecializations)
      .catch(() => setSpecializations([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { specializations, isLoading };
}

