import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../services/errors";

// fetcher(params, signal) -> Promise. `fetcher` must be a stable function.
export function useFetch(fetcher, params, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  const key = JSON.stringify(params);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetcher(JSON.parse(key), controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(err));
        setLoading(false);
      });

    return () => controller.abort();
  }, [fetcher, key, reloadCount, enabled]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { data, loading, error, reload };
}