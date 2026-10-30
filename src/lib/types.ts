export type Scenario = 'moderate' | 'rapid';
export type LearningPreferences = {
  focus: 'data' | 'people' | 'operations' | 'sustainability';
  format: 'guided' | 'practice' | 'discussion';
  sessionMinutes: number;
  workAnswer?: string;
  practiceAnswer?: string;
};
export type SkillId =
  | 'excel'
  | 'data'
  | 'critical'
  | 'communication'
  | 'project'
  | 'stakeholder'
  | 'sql'
  | 'visual'
  | 'ai'
  | 'ethics'
  | 'process'
  | 'logistics'
  | 'sustainability'
  | 'teaching'
  | 'security'
  | 'python'
  | 'htmlcss'
  | 'javascript'
  | 'marketing';
export type CareerGoal = {
  title: string;
  description: string;
  family: 'data' | 'people' | 'operations' | 'sustainability';
  requirements: Partial<Record<SkillId, number>>;
  otherSkills: string[];
  summary: string;
  mode: 'ai' | 'local' | 'manual';
};
export type Profile = {
  id: string;
  name: string;
  currentRole: string;
  hours: number;
  budget: number;
  weeks: number;
  interests: string[];
  /** Interests in the person's own words; matching ones count towards work areas. */
  customInterests?: string[];
  skills: Partial<Record<SkillId, number>>;
  completed: string[];
  learningPreferences?: LearningPreferences;
};
export type Skill = {
  id: SkillId;
  label: string;
  aliases: string[];
  prerequisites: SkillId[];
  target: string;
  rationale: string;
};
export type Role = {
  custom?: boolean;
  id: string;
  title: string;
  shortTitle: string;
  family: string;
  description: string;
  requirements: Partial<Record<SkillId, number>>;
  exposure: number;
  source: string;
  target: string;
  rationale: string;
  entry: string;
  color: string;
};
/** An optional YouTube overview; never counted in planned hours. */
export type CourseVideo = {
  /** YouTube video ID; also names the video's cover image. */
  id: string;
  title: string;
  channel: string;
  url: string;
  /** Length as YouTube displays it, e.g. 4:30 or 1:14:33. */
  duration: string;
  checkedAt: string;
};
export type Course = {
  id: string;
  title: string;
  provider: string;
  url: string;
  hours: number;
  durationKind: 'provider' | 'planning estimate';
  fee: number;
  funding: 'free' | 'hrd';
  skills: SkillId[];
  prerequisites: SkillId[];
  checkedAt: string;
  note: string;
  video?: CourseVideo;
};
export type Signal = {
  id: string;
  title: string;
  url: string;
  publishedAt: string | null;
  collectedAt: string;
  kind: 'jobs' | 'research' | 'simulation';
  geography: string;
  skills: SkillId[];
};
export type Snapshot = {
  id: string;
  label: string;
  asOf: string;
  kind: 'simulation' | 'live';
  market: Partial<Record<SkillId, number>>;
  signals: Signal[];
  sampleSize: number;
  note: string;
};
export type Match = {
  role: Role;
  score: number;
  coverage: number;
  distance: number;
  market: number;
  resilience: number;
  interest: number;
  gaps: { id: SkillId; current: number; required: number; gap: number }[];
  reused: SkillId[];
};
export type PlanStep = {
  course: Course;
  startWeek: number;
  endWeek: number;
  shared: boolean;
};
export type LearningPlan = {
  steps: PlanStep[];
  totalHours: number;
  totalCost: number;
  weeks: { week: number; hours: number; courseIds: string[] }[];
  uncovered: SkillId[];
  completed: Course[];
};
