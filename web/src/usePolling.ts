import { useCallback, useEffect, useRef, useState } from "react";

export interface Polled<T> {
  data: T | null;
  error: string;
  loading: boolean;
  updatedAt: number | null;
  refresh: () => void;
}

/**
 * Fetch now, then every `intervalMs` while the tab is visible. Also refetches when the tab
 * regains focus, and restarts when `key` changes (e.g. a different repo or token).
 */
export function usePolling<T>(fetcher: () => Promise<T>, key: string, intervalMs = 15_000): Polled<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const latest = useRef(fetcher);
  latest.current = fetcher;

  const run = useCallback(async () => {
    setLoading(true);
    try {
      setData(await latest.current());
      setError("");
      setUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setData(null);
    void run();
    const whenVisible = () => { if (!document.hidden) void run(); };
    const id = setInterval(whenVisible, intervalMs);
    document.addEventListener("visibilitychange", whenVisible);
    window.addEventListener("focus", whenVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", whenVisible);
      window.removeEventListener("focus", whenVisible);
    };
  }, [run, key, intervalMs]);

  const refresh = useCallback(() => void run(), [run]);
  return { data, error, loading, updatedAt, refresh };
}

/** Re-render every second so relative timestamps stay current. */
export function useNow(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
