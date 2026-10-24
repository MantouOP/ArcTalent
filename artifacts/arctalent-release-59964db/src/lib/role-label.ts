import type { Role } from './types';

/** User-authored destinations stay canonical when the interface language changes. */
export function roleLabel(
  role: Role,
  translate: (text: string) => string,
  short = false,
): string {
  const title = short ? role.shortTitle : role.title;
  return role.custom ? title : translate(title);
}
