import { useCallback, useState } from "react";

// Open/close state for a dialog plus the item it's acting on. `key` changes on
// every show(), so passing it as the dialog's React key gives each opening fresh
// form state. `value` is kept after close so content doesn't vanish mid-animation.
export function useDialog<T>() {
  const [state, setState] = useState<{ open: boolean; value: T | null; key: number }>({ open: false, value: null, key: 0 });
  const show = useCallback((value: T | null = null) => setState((s) => ({ open: true, value, key: s.key + 1 })), []);
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  return { ...state, show, close };
}
