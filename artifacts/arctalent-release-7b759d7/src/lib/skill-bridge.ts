import type { Profile, Role, SkillId } from './types';

type BridgeRow = {
  id: SkillId;
  current: number;
  required: number;
  gap: number;
  status: 'ready' | 'developing' | 'new';
};

export function buildSkillBridge(
  profile: Profile,
  role: Role,
): {
  rows: BridgeRow[];
  ready: number;
  developing: number;
  newSkills: number;
  coverage: number;
} {
  const rows: BridgeRow[] = (
    Object.entries(role.requirements) as [SkillId, number][]
  )
    .filter(([, required]) => required > 0)
    .map(([id, required]) => {
      const current = profile.skills[id] ?? 0;
      return {
        id,
        current,
        required,
        gap: Math.max(0, required - current),
        status:
          current >= required ? 'ready' : current > 0 ? 'developing' : 'new',
      };
    });
  const required = rows.reduce((sum, row) => sum + row.required, 0);
  const covered = rows.reduce(
    (sum, row) => sum + Math.min(row.current, row.required),
    0,
  );
  return {
    rows,
    ready: rows.filter((row) => row.status === 'ready').length,
    developing: rows.filter((row) => row.status === 'developing').length,
    newSkills: rows.filter((row) => row.status === 'new').length,
    coverage: required ? Math.round((covered / required) * 10000) / 100 : 0,
  };
}
