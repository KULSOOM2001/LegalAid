import { useCallback, useEffect, useState } from 'react';
import { casesApi } from '../api/cases';
import type { Case } from '../types';

export function useCases(params?: Record<string, string | number>) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await casesApi.list(params);
      setCases(res.items || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
  const handler = () => refresh();
  window.addEventListener('legalaid:case-updated', handler);
  return () => window.removeEventListener('legalaid:case-updated', handler);
}, [refresh]);

  return { cases, loading, error, refresh };
}
