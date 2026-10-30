import type { Profile } from './types';

/** The work areas that route scores can read; every role belongs to one. */
export const interestAreas = [
  { id: 'data', label: 'Data & insights' },
  { id: 'people', label: 'People & projects' },
  { id: 'operations', label: 'Business operations' },
  { id: 'sustainability', label: 'Sustainability' },
] as const;
export type InterestArea = (typeof interestAreas)[number]['id'];

export const maxCustomInterests = 8;
export const maxCustomInterestLength = 40;

/**
 * Words that tie an interest typed in the person's own words to a work area,
 * in English, Malay and Simplified Chinese. Latin words match from the start
 * of a word (so "analy" matches "analysis"); words of three letters or fewer,
 * and those in `wholeWords`, must match whole. Chinese words match anywhere.
 */
const areaWords: Record<InterestArea, readonly string[]> = {
  data: [
    'data',
    'analy',
    'statistic',
    'spreadsheet',
    'excel',
    'sql',
    'dashboard',
    'report',
    'research',
    'insight',
    'financ',
    'accounting',
    'bookkeep',
    'number',
    'python',
    'visuali',
    'chart',
    'ai',
    'bi',
    'machine learning',
    'artificial intelligence',
    'analisis',
    'statistik',
    'kewangan',
    'perakaunan',
    'penyelidikan',
    'laporan',
    'hamparan',
    'kecerdasan buatan',
    '数据',
    '分析',
    '统计',
    '财务',
    '会计',
    '研究',
    '报表',
    '人工智能',
    '可视化',
    '图表',
  ],
  people: [
    'people',
    'project',
    'team',
    'leader',
    'hr',
    'human resource',
    'coach',
    'mentor',
    'teach',
    'train',
    'educat',
    'recruit',
    'customer',
    'client',
    'communit',
    'communicat',
    'event',
    'volunteer',
    'counsel',
    'stakeholder',
    'facilitat',
    'talent',
    'projek',
    'pasukan',
    'kepimpinan',
    'pemimpin',
    'sumber manusia',
    'bimbingan',
    'mengajar',
    'pengajaran',
    'latihan',
    'pendidikan',
    'pelanggan',
    'komuniti',
    'komunikasi',
    'acara',
    'sukarelawan',
    'kaunseling',
    '项目',
    '团队',
    '领导',
    '人力资源',
    '辅导',
    '导师',
    '教学',
    '教育',
    '培训',
    '招聘',
    '客户',
    '社区',
    '沟通',
    '活动',
    '志愿',
  ],
  operations: [
    'operation',
    'logistic',
    'supply chain',
    'process',
    'admin',
    'procure',
    'purchas',
    'inventor',
    'warehous',
    'quality',
    'manufactur',
    'retail',
    'business',
    'schedul',
    'workflow',
    'compliance',
    'shipping',
    'transport',
    'operasi',
    'logistik',
    'rantaian bekalan',
    'proses',
    'pentadbiran',
    'perolehan',
    'pembelian',
    'inventori',
    'gudang',
    'kualiti',
    'pembuatan',
    'runcit',
    'perniagaan',
    'penjadualan',
    'pematuhan',
    'pengangkutan',
    '运营',
    '营运',
    '物流',
    '供应链',
    '流程',
    '行政',
    '采购',
    '库存',
    '仓库',
    '质量',
    '品质',
    '制造',
    '零售',
    '商业',
    '业务',
    '合规',
    '运输',
  ],
  sustainability: [
    'sustainab',
    'environment',
    'climate',
    'green',
    'energy',
    'recycl',
    'esg',
    'carbon',
    'renewable',
    'conservation',
    'agricultur',
    'solar',
    'waste',
    'nature',
    'biodiversity',
    'ecolog',
    'emission',
    'circular economy',
    'kelestarian',
    'kemampanan',
    'mampan',
    'alam sekitar',
    'iklim',
    'hijau',
    'tenaga boleh baharu',
    'kitar semula',
    'karbon',
    'pertanian',
    'sisa',
    'pelepasan',
    'biodiversiti',
    '可持续',
    '环境',
    '环保',
    '气候',
    '绿色',
    '能源',
    '回收',
    '碳排放',
    '碳中和',
    '低碳',
    '农业',
    '废物',
    '排放',
    '生态',
  ],
};

/** Words that would otherwise match inside unrelated words ("excellent"). */
const wholeWords = new Set(['excel']);
const han = /\p{Script=Han}/u;
const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchers = interestAreas.map(({ id }) => ({
  id,
  tests: areaWords[id].map((word) => {
    if (han.test(word)) return (text: string) => text.includes(word);
    const whole = word.length <= 3 || wholeWords.has(word);
    const end = whole ? '(?![\\p{L}\\p{N}])' : '';
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escape(word)}${end}`, 'u');
    return (text: string) => pattern.test(text);
  }),
}));

/** Work areas an interest in the person's own words points to; [] when none match. */
export function matchInterestAreas(text: string): InterestArea[] {
  const normalised = text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ');
  return matchers
    .filter(({ tests }) => tests.some((test) => test(normalised)))
    .map(({ id }) => id);
}

/** Ticked work areas plus those matched from the person's own interests, sorted. */
export function effectiveInterests(
  profile: Pick<Profile, 'interests' | 'customInterests'>,
): string[] {
  const areas = new Set(profile.interests);
  for (const interest of profile.customInterests ?? [])
    for (const area of matchInterestAreas(interest)) areas.add(area);
  return [...areas].sort();
}
