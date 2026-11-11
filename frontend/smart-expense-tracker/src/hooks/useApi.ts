import { useCallback, useEffect, useState, type DependencyList } from "react";
import { errorMessage } from "../api/errors";

interface ApiState<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
}

// Loads data when the component mounts and whenever `deps` change. While a
// refetch is in flight the previous `data` stays in place, so the page can dim
// it instead of flashing a spinner. Call `reload()` after a mutation.
export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<ApiState<T>>({ data: undefined, error: null, loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    fetcher().then(
      (data) => !cancelled && setState({ data, error: null, loading: false }),
      (error) => !cancelled && setState((s) => ({ ...s, error: errorMessage(error), loading: false }))
    );
    return () => {
      cancelled = true;
    };
    // `fetcher` is a new closure every render; `deps` says when it actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
