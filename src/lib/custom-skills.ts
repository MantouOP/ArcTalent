import { skills } from './catalogue';
import { extractAliases } from './engine';
import type { CustomSkill, Profile, SkillId } from './types';

export const maxCustomSkills = 8;
export const maxCustomSkillLength = 60;

export function normaliseSkillName(name: string) {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ');
}

/** The catalogue skill a typed name already means ("MS Excel" is Spreadsheets), if any. */
export function matchCatalogueSkill(name: string): SkillId | null {
  const text = normaliseSkillName(name);
  const lower = text.toLowerCase();
  const byLabel = skills.find((skill) => skill.label.toLowerCase() === lower);
  if (byLabel) return byLabel.id;
  const found = extractAliases(text);
  return found.length === 1 ? found[0].id : null;
}

/**
 * Adds a skill typed in the person's own words. A catalogue skill raises that
 * skill's level instead of being listed twice; a repeated name updates its level.
 */
export function addCustomSkill(
  profile: Profile,
  name: string,
  level: number,
): { profile: Profile; matched: SkillId | null } {
  const clean = normaliseSkillName(name).slice(0, maxCustomSkillLength);
  const safeLevel = Math.min(3, Math.max(1, Math.round(level)));
  if (!clean) return { profile, matched: null };
  const matched = matchCatalogueSkill(clean);
  if (matched)
    return {
      matched,
      profile: {
        ...profile,
        skills: {
          ...profile.skills,
          [matched]: Math.max(profile.skills[matched] ?? 0, safeLevel),
        },
      },
    };
  const existing = profile.customSkills ?? [];
  const key = clean.toLowerCase();
  const repeated = existing.some((skill) => skill.name.toLowerCase() === key);
  if (!repeated && existing.length >= maxCustomSkills)
    return { profile, matched: null };
  const customSkills: CustomSkill[] = repeated
    ? existing.map((skill) =>
        skill.name.toLowerCase() === key
          ? { ...skill, level: safeLevel }
          : skill,
      )
    : [...existing, { name: clean, level: safeLevel }];
  return { profile: { ...profile, customSkills }, matched: null };
}

const comparable = (text: string) =>
  ` ${normaliseSkillName(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#]+/gu, ' ')
    .trim()} `;

/** Whether a custom skill names a specialist skill, as whole words either way round. */
function covers(customName: string, specialist: string) {
  const a = comparable(customName),
    b = comparable(specialist);
  if (a.trim().length < 2 || b.trim().length < 2) return false;
  return a.includes(b) || b.includes(a);
}

/** Splits a destination's specialist skills into those the person already lists and the rest. */
export function splitSpecialistSkills(
  specialist: string[],
  customSkills: CustomSkill[] = [],
) {
  const covered: string[] = [],
    remaining: string[] = [];
  for (const skill of specialist)
    (customSkills.some((own) => covers(own.name, skill))
      ? covered
      : remaining
    ).push(skill);
  return { covered, remaining };
}
