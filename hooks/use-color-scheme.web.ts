import { useSyncExternalStore } from 'react';
import type { AppColorScheme } from './use-color-scheme';

const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

function subscribe(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(DARK_MODE_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);
  return () => mediaQuery.removeEventListener('change', onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(DARK_MODE_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useColorScheme(): AppColorScheme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
    ? 'dark'
    : 'light';
}
