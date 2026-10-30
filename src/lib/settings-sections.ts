export const settingsSections = [
  'profile',
  'skills',
  'display',
  'data',
] as const;
export type SettingsSection = (typeof settingsSections)[number];

/** The tab a key press moves to in the horizontal settings tab list. */
export function sectionForKey(
  current: SettingsSection,
  key: string,
): SettingsSection | null {
  const index = settingsSections.indexOf(current);
  const last = settingsSections.length - 1;
  const next =
    key === 'ArrowRight'
      ? index === last
        ? 0
        : index + 1
      : key === 'ArrowLeft'
        ? index === 0
          ? last
          : index - 1
        : key === 'Home'
          ? 0
          : key === 'End'
            ? last
            : null;
  return next === null ? null : settingsSections[next];
}
