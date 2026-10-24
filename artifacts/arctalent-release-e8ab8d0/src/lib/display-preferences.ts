export type DisplayPreferences = {
  textSize: 'standard' | 'larger';
  reduceMotion: boolean;
};
export const displayPreferencesStorageKey = 'arctalent-display-v1';
export function restoreDisplayPreferences(value?: unknown): DisplayPreferences {
  const saved =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    textSize: saved.textSize === 'larger' ? 'larger' : 'standard',
    reduceMotion: saved.reduceMotion === true,
  };
}
export function shouldReduceMotion(
  preferences: DisplayPreferences,
  deviceReduced: boolean,
): boolean {
  return preferences.reduceMotion || deviceReduced;
}
