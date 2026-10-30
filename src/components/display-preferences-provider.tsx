'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  displayPreferencesStorageKey,
  restoreDisplayPreferences,
  type DisplayPreferences,
} from '@/lib/display-preferences';
import './display-preferences.css';

type DisplayContext = {
  preferences: DisplayPreferences;
  updatePreferences: (changes: Partial<DisplayPreferences>) => void;
  resetPreferences: () => void;
  storage: 'checking' | 'saved' | 'unavailable';
};
const DisplayContext = createContext<DisplayContext>({
  preferences: restoreDisplayPreferences(),
  updatePreferences: () => {},
  resetPreferences: () => {},
  storage: 'checking',
});

export function DisplayPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<DisplayPreferences>(() =>
    restoreDisplayPreferences(),
  );
  const [ready, setReady] = useState(false);
  const [storage, setStorage] = useState<DisplayContext['storage']>('checking');
  useEffect(() => {
    try {
      const raw = localStorage.getItem(displayPreferencesStorageKey);
      if (raw) setPreferences(restoreDisplayPreferences(JSON.parse(raw)));
    } catch {
      /* Invalid or unavailable storage must not prevent rendering. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.readingSize = preferences.textSize;
    document.documentElement.dataset.reduceMotion = String(
      preferences.reduceMotion,
    );
    document.documentElement.dataset.reduceEffects = String(
      preferences.reduceEffects,
    );
    if (!ready) return;
    try {
      localStorage.setItem(
        displayPreferencesStorageKey,
        JSON.stringify(preferences),
      );
      setStorage('saved');
    } catch {
      setStorage('unavailable');
    }
  }, [preferences, ready]);
  const updatePreferences = useCallback(
    (changes: Partial<DisplayPreferences>) => {
      setPreferences((current) =>
        restoreDisplayPreferences({ ...current, ...changes }),
      );
    },
    [],
  );
  const resetPreferences = useCallback(
    () => setPreferences(restoreDisplayPreferences()),
    [],
  );
  const value = useMemo(
    () => ({ preferences, updatePreferences, resetPreferences, storage }),
    [preferences, updatePreferences, resetPreferences, storage],
  );
  return (
    <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>
  );
}
export function useDisplayPreferences() {
  return useContext(DisplayContext);
}
