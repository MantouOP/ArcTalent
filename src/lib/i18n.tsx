'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { skillById } from './catalogue';
import { focusOptions as baseFocusOptions, formatOptions as baseFormatOptions } from './learning-preferences';
import type { Course, Role, Signal, SkillId, Snapshot } from './types';

export type Language = 'en' | 'zh' | 'ms';

export const LANGUAGES: {
  id: Language;
  label: string;
  short: string;
  htmlLang: string;
  dateLocale: string;
}[] = [
  {
    id: 'en',
    label: 'English',
    short: 'EN',
    htmlLang: 'en',
    dateLocale: 'en-MY',
  },
  {
    id: 'zh',
    label: '简体中文',
    short: '中文',
    htmlLang: 'zh-CN',
    dateLocale: 'zh-CN',
  },
  {
    id: 'ms',
    label: 'Bahasa Melayu',
    short: 'BM',
    htmlLang: 'ms',
    dateLocale: 'ms-MY',
  },
];

const skillTranslations: Record<
  Language,
  Record<SkillId, { label: string; rationale: string }>
> = {
  en: {
    excel: {
      label: 'Spreadsheets',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    data: {
      label: 'Data literacy',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    critical: {
      label: 'Critical thinking',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    communication: {
      label: 'Communication',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    project: {
      label: 'Project planning',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    stakeholder: {
      label: 'Stakeholder engagement',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    sql: {
      label: 'SQL',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    visual: {
      label: 'Data visualisation',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    ai: {
      label: 'AI literacy',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    ethics: {
      label: 'Responsible AI',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    process: {
      label: 'Process improvement',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    logistics: {
      label: 'Supply chain',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    sustainability: {
      label: 'Sustainability literacy',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    teaching: {
      label: 'Learning design',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    security: {
      label: 'Digital security',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
    python: {
      label: 'Python',
      rationale:
        'Develop a transferable technical or vocational skill used at work. This is a contextual mapping, not a measured SDG outcome.',
    },
  },
  zh: {
    excel: {
      label: '电子表格',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    data: {
      label: '数据素养',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    critical: {
      label: '批判性思维',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    communication: {
      label: '沟通能力',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    project: {
      label: '项目规划',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    stakeholder: {
      label: '利益相关者沟通',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    sql: {
      label: 'SQL',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    visual: {
      label: '数据可视化',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    ai: {
      label: '人工智能素养',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    ethics: {
      label: '负责任的人工智能',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    process: {
      label: '流程改进',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    logistics: {
      label: '供应链管理',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    sustainability: {
      label: '可持续发展素养',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    teaching: {
      label: '学习设计',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    security: {
      label: '数字安全',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
    python: {
      label: 'Python',
      rationale:
        '培养在工作中使用的可迁移技术或职业技能。这是背景映射，而非经测量的可持续发展目标（SDG）成果。',
    },
  },
  ms: {
    excel: {
      label: 'Hamparan data',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    data: {
      label: 'Literasi data',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    critical: {
      label: 'Pemikiran kritis',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    communication: {
      label: 'Komunikasi',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    project: {
      label: 'Perancangan projek',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    stakeholder: {
      label: 'Penglibatan pihak berkepentingan',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    sql: {
      label: 'SQL',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    visual: {
      label: 'Visualisasi data',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    ai: {
      label: 'Literasi AI',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    ethics: {
      label: 'AI bertanggungjawab',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    process: {
      label: 'Penambahbaikan proses',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    logistics: {
      label: 'Rantaian bekalan',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    sustainability: {
      label: 'Literasi kelestarian',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    teaching: {
      label: 'Reka bentuk pembelajaran',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    security: {
      label: 'Keselamatan digital',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
    python: {
      label: 'Python',
      rationale:
        'Membina kemahiran teknikal atau vokasional boleh pindah yang digunakan di tempat kerja. Ini ialah pemetaan konteks, bukan hasil SDG yang diukur.',
    },
  },
};

const roleTranslations: Record<
  Language,
  Record<
    string,
    {
      title: string;
      shortTitle: string;
      description: string;
      rationale: string;
      entry: string;
    }
  >
> = {
  en: {},
  zh: {
    bi: {
      title: '商业智能分析师',
      shortTitle: '商业智能',
      description: '将业务数据转化为实用的报告和决策。',
      rationale: '数据分析可支持技术升级并优化业务流程。',
      entry:
        '探索该职业并核实当地雇主的要求。可能需要相关学历和工作经验；此短期路径并不代表已具备完全的岗位胜任力。',
    },
    project: {
      title: '项目管理专员',
      shortTitle: '项目管理',
      description: '协调人员、计划与资源以顺利交付项目。',
      rationale: '项目协调有助于组织实施富有成效的改进。',
      entry:
        '探索该职业并核实当地雇主的要求。可能需要相关学历和工作经验；此短期路径并不代表已具备完全的岗位胜任力。',
    },
    sustainability: {
      title: '可持续发展专员',
      shortTitle: '可持续发展',
      description: '帮助组织了解并改善环境与可持续发展实践。',
      rationale:
        '当应用于实际基础设施或工业实践时，这些技能可支持更高资源效率的运营。',
      entry:
        '探索该职业并核实当地雇主的要求。可能需要相关学历和工作经验；此短期路径并不代表已具备完全的岗位胜任力。',
    },
    logistics: {
      title: '物流与供应链专员',
      shortTitle: '物流管理',
      description: '协调产品流转并优化供应链流程。',
      rationale: '供应链协调有助于推动运营效率提升。',
      entry:
        '探索该职业并核实当地雇主的要求。可能需要相关学历和工作经验；此短期路径并不代表已具备完全的岗位胜任力。',
    },
    training: {
      title: '培训与发展专员',
      shortTitle: '学习与发展',
      description: '识别学习需求并帮助同事提升工作技能。',
      rationale: '职场培训直接关系到相关工作技能的培养与发展。',
      entry:
        '探索该职业并核实当地雇主的要求。可能需要相关学历和工作经验；此短期路径并不代表已具备完全的岗位胜任力。',
    },
    management: {
      title: '管理与运营分析师',
      shortTitle: '业务运营',
      description: '研究工作流程并提出组织改进方案。',
      rationale: '流程分析可支持生产力提升，具体取决于实施与评估情况。',
      entry:
        '探索该职业并核实当地雇主的要求。可能需要相关学历和工作经验；此短期路径并不代表已具备完全的岗位胜任力。',
    },
  },
  ms: {
    bi: {
      title: 'Penganalisis Pintar Perniagaan',
      shortTitle: 'Pintar perniagaan',
      description:
        'Tukarkan data perniagaan kepada laporan dan keputusan yang berguna.',
      rationale:
        'Analisis data dapat menyokong penaiktarafan teknologi dan proses perniagaan yang lebih baik.',
      entry:
        'Terokai pekerjaan ini, kemudian semak keperluan majikan tempatan. Pendidikan dan pengalaman kerja berkaitan mungkin diperlukan; laluan ringkas ini tidak menjamin kesediaan kerja sepenuhnya.',
    },
    project: {
      title: 'Pakar Pengurusan Projek',
      shortTitle: 'Pengurusan projek',
      description:
        'Selaraskan warga kerja, pelan dan sumber untuk menjayakan projek.',
      rationale:
        'Penyelarasan projek membantu organisasi melaksanakan penambahbaikan yang produktif.',
      entry:
        'Terokai pekerjaan ini, kemudian semak keperluan majikan tempatan. Pendidikan dan pengalaman kerja berkaitan mungkin diperlukan; laluan ringkas ini tidak menjamin kesediaan kerja sepenuhnya.',
    },
    sustainability: {
      title: 'Pakar Kelestarian',
      shortTitle: 'Kelestarian',
      description:
        'Bantu organisasi memahami dan menambah baik amalan alam sekitar.',
      rationale:
        'Kemahiran ini menyokong operasi yang lebih cekap sumber apabila digunakan pada infrastruktur atau amalan industri sebenar.',
      entry:
        'Terokai pekerjaan ini, kemudian semak keperluan majikan tempatan. Pendidikan dan pengalaman kerja berkaitan mungkin diperlukan; laluan ringkas ini tidak menjamin kesediaan kerja sepenuhnya.',
    },
    logistics: {
      title: 'Pakar Logistik',
      shortTitle: 'Logistik',
      description:
        'Selaraskan pergerakan produk dan tambah baik proses bekalan.',
      rationale:
        'Penyelarasan rantaian bekalan dapat menyokong penambahbaikan operasi.',
      entry:
        'Terokai pekerjaan ini, kemudian semak keperluan majikan tempatan. Pendidikan dan pengalaman kerja berkaitan mungkin diperlukan; laluan ringkas ini tidak menjamin kesediaan kerja sepenuhnya.',
    },
    training: {
      title: 'Pakar Latihan & Pembangunan',
      shortTitle: 'Pembelajaran & pembangunan',
      description:
        'Kenal pasti keperluan pembelajaran dan bantu rakan sekerja membina kemahiran kerja.',
      rationale:
        'Latihan di tempat kerja berkait secara langsung dengan pembangunan kemahiran yang relevan.',
      entry:
        'Terokai pekerjaan ini, kemudian semak keperluan majikan tempatan. Pendidikan dan pengalaman kerja berkaitan mungkin diperlukan; laluan ringkas ini tidak menjamin kesediaan kerja sepenuhnya.',
    },
    management: {
      title: 'Penganalisis Pengurusan',
      shortTitle: 'Operasi perniagaan',
      description:
        'Kaji proses kerja dan cadangkan penambahbaikan organisasi.',
      rationale:
        'Analisis proses menyokong peningkatan produktiviti, tertakluk kepada pelaksanaan dan penilaian.',
      entry:
        'Terokai pekerjaan ini, kemudian semak keperluan majikan tempatan. Pendidikan dan pengalaman kerja berkaitan mungkin diperlukan; laluan ringkas ini tidak menjamin kesediaan kerja sepenuhnya.',
    },
  },
};

const courseTranslations: Record<
  Language,
  Record<string, { title: string; note: string }>
> = {
  en: {},
  zh: {
    excel: {
      title: '数据分析：Excel 可视化',
      note: '需要 Excel 或类似的电子表格工具；不包含软件和网络费用。',
    },
    thinking: {
      title: '培养你的批判性思维',
      note: '完成课程仅记录学习活动，不代表经验证的技能熟练度。',
    },
    communication: {
      title: '职场有效沟通',
      note: '完成课程仅记录学习活动，不代表经验证的技能熟练度。',
    },
    project: {
      title: '项目管理：项目之旅的起点',
      note: '完成课程仅记录学习活动，不代表经验证的技能熟练度。',
    },
    sql: {
      title: 'SQLBolt 交互式 SQL 课程',
      note: '8 小时为团队规划的学习时间；SQLBolt 官方未公布固定完成时长。',
    },
    powerbi: {
      title: '开始使用 Power BI 构建报表',
      note: '2 小时包含实操练习。模块阅读免费开放；部分 Power BI 服务需额外许可。',
    },
    responsible: {
      title: '践行负责任的 AI 原则与实践',
      note: '需具备基础 AI 与业务概念。阅读路径不需要付费 Azure 资源。',
    },
    'thinking-ou': {
      title: '拓展与深化你的思维能力',
      note: '完成课程仅记录学习活动，不代表经验证的技能熟练度。',
    },
    'project-v': {
      title: '使用 V 模型方法管理项目',
      note: '完成课程仅记录学习活动，不代表经验证的技能熟练度。',
    },
    operations: {
      title: '运营管理导论',
      note: '完成课程仅记录学习活动，不代表经验证的技能熟练度。',
    },
    environment: {
      title: '环境：轻踏地球的环保实践',
      note: '完成课程仅记录学习活动，不代表经验证的技能熟练度。',
    },
  },
  ms: {
    excel: {
      title: 'Analisis data: visualisasi dalam Excel',
      note: 'Memerlukan Excel atau alat hamparan serupa; kos perisian dan sambungan internet tidak termasuk.',
    },
    thinking: {
      title: 'Bangunkan Pemikiran Kritis Anda',
      note: 'Penyempurnaan kursus merekodkan aktiviti pembelajaran, bukan tahap penguasaan yang disahkan.',
    },
    communication: {
      title: 'Komunikasi berkesan di tempat kerja',
      note: 'Penyempurnaan kursus merekodkan aktiviti pembelajaran, bukan tahap penguasaan yang disahkan.',
    },
    project: {
      title: 'Pengurusan projek: permulaan perjalanan projek',
      note: 'Penyempurnaan kursus merekodkan aktiviti pembelajaran, bukan tahap penguasaan yang disahkan.',
    },
    sql: {
      title: 'Pelajaran SQL interaktif SQLBolt',
      note: 'Lapan jam ialah anggaran masa belajar pasukan; SQLBolt tidak menetapkan tempoh tamat yang tetap.',
    },
    powerbi: {
      title: 'Mulakan pembinaan dengan Power BI',
      note: 'Dua jam termasuk latihan amali. Bacaan modul adalah percuma; sesetengah perkhidmatan Power BI mempunyai pelesenan berasingan.',
    },
    responsible: {
      title: 'Amalkan prinsip dan praktis AI bertanggungjawab',
      note: 'Konsep asas AI dan perniagaan ialah prasyarat. Sumber Azure berbayar tidak diperlukan untuk laluan bacaan.',
    },
    'thinking-ou': {
      title: 'Meluaskan dan membangunkan kemahiran berfikir anda',
      note: 'Penyempurnaan kursus merekodkan aktiviti pembelajaran, bukan tahap penguasaan yang disahkan.',
    },
    'project-v': {
      title: 'Urus Projek Anda Menggunakan Metodologi V-Model',
      note: 'Penyempurnaan kursus merekodkan aktiviti pembelajaran, bukan tahap penguasaan yang disahkan.',
    },
    operations: {
      title: 'Pengenalan kepada pengurusan operasi',
      note: 'Penyempurnaan kursus merekodkan aktiviti pembelajaran, bukan tahap penguasaan yang disahkan.',
    },
    environment: {
      title: 'Alam sekitar: melangkah secara lestari di Bumi',
      note: 'Penyempurnaan kursus merekodkan aktiviti pembelajaran, bukan tahap penguasaan yang disahkan.',
    },
  },
};

const currentRoleTranslations: Record<Language, Record<string, string>> = {
  en: {},
  zh: {
    'Administrative assistant': '行政助理',
    'Customer support executive': '客户支持专员',
    'Accounts assistant': '会记助理',
    'Inventory coordinator': '库存协调员',
    'HR assistant': '人力资源助理',
    'Sales administrator': '销售行政人员',
    'Office coordinator': '办公室协调员',
    'Operations assistant': '运营助理',
  },
  ms: {
    'Administrative assistant': 'Pembantu tadbir',
    'Customer support executive': 'Eksekutif sokongan pelanggan',
    'Accounts assistant': 'Pembantu akaun',
    'Inventory coordinator': 'Penyelaras inventori',
    'HR assistant': 'Pembantu sumber manusia',
    'Sales administrator': 'Pentadbir jualan',
    'Office coordinator': 'Penyelaras pejabat',
    'Operations assistant': 'Pembantu operasi',
  },
};

export type FocusOption = {
  value: 'data' | 'people' | 'operations' | 'sustainability';
  label: string;
  detail: string;
  interest: string;
};

export type FormatOption = {
  value: 'guided' | 'practice' | 'discussion';
  label: string;
  detail: string;
  tip: string;
};

const focusTranslations: Record<Language, readonly FocusOption[]> = {
  en: baseFocusOptions,
  zh: [
    {
      value: 'data' as const,
      label: '发现数据背后的故事',
      detail: '寻找规律、探究问题并解释数字背后的含义。',
      interest: '数据与洞察',
    },
    {
      value: 'people' as const,
      label: '帮助团队共同前行',
      detail: '协调项目进展、阐述想法或帮助同事学习成长。',
      interest: '人员与项目',
    },
    {
      value: 'operations' as const,
      label: '让日常工作更高效顺畅',
      detail: '优化流程、组织资源并解决实际运营瓶颈。',
      interest: '业务运营',
    },
    {
      value: 'sustainability' as const,
      label: '解决环境与可持续挑战',
      detail: '减少浪费，了解并改善组织对环境的影响。',
      interest: '可持续发展',
    },
  ],
  ms: [
    {
      value: 'data' as const,
      label: 'Cari cerita di sebalik data',
      detail:
        'Kenal pasti corak, siasat persoalan dan terangkan maksud angka.',
      interest: 'Data & wawasan',
    },
    {
      value: 'people' as const,
      label: 'Bantu orang lain bergerak ke hadapan',
      detail:
        'Selaraskan projek, terangkan idea atau bantu rakan sekerja belajar.',
      interest: 'Manusia & projek',
    },
    {
      value: 'operations' as const,
      label: 'Jadikan kerja harian lebih lancar',
      detail:
        'Tambah baik proses, susun sumber dan selesaikan kekangan praktikal.',
      interest: 'Operasi perniagaan',
    },
    {
      value: 'sustainability' as const,
      label: 'Selesaikan cabaran alam sekitar',
      detail:
        'Kurangkan pembaziran dan fahami kesan organisasi terhadap alam sekitar.',
      interest: 'Kelestarian',
    },
  ],
};

const formatTranslations: Record<Language, readonly FormatOption[]> = {
  en: baseFormatOptions,
  zh: [
    {
      value: 'guided' as const,
      label: '跟随实例逐步练习',
      detail: '先阅读或观看简短课程，然后自己动手尝试各个步骤。',
      tip: '从完整示例开始，自己重做一遍，然后在不看教程的情况下解释其中一个步骤。',
    },
    {
      value: 'practice' as const,
      label: '动手完成实用作品',
      detail: '通过构建小型报表、流程或项目来学习。',
      tip: '围绕一个虚拟工作问题做小型练习项目，保存成果并记录仍需加强的部分。',
    },
    {
      value: 'discussion' as const,
      label: '讲解与讨论想法',
      detail: '与同事或学习伙伴交流讨论所学内容。',
      tip: '向学习伙伴讲解一个概念，或录下一段简短讲解；根据对方的问题决定下一步复习重点。',
    },
  ],
  ms: [
    {
      value: 'guided' as const,
      label: 'Ikuti contoh langkah demi langkah',
      detail:
        'Baca atau tonton pelajaran ringkas, kemudian cuba langkah tersebut sendiri.',
      tip: 'Mulakan dengan contoh kerja. Bina semula, kemudian terangkan satu langkah tanpa melihat nota.',
    },
    {
      value: 'practice' as const,
      label: 'Hasilkan sesuatu yang praktikal',
      detail:
        'Belajar dengan membina laporan kecil, proses atau projek.',
      tip: 'Gunakan masalah kerja rekaan untuk projek latihan kecil. Simpan hasilnya dan catatkan perkara yang masih perlu dilatih.',
    },
    {
      value: 'discussion' as const,
      label: 'Terangkan dan bincangkan idea',
      detail:
        'Bincangkan perkara yang dipelajari bersama rakan sekerja atau rakan belajar.',
      tip: 'Terangkan satu idea kepada rakan belajar, atau rakam penerangan ringkas untuk diri sendiri. Gunakan soalan mereka untuk memilih topik ulang kaji.',
    },
  ],
};

export const dictionaries = {
  en: {
    skipToContent: 'Skip to content',
    homeAria: 'ArcTalent home',
    brandTagline: 'BUILD YOUR NEXT CHAPTER',
    yourWorkspace: 'YOUR WORKSPACE',
    mainNavAria: 'Main navigation',
    nav: {
      explore: 'Career explorer',
      pathway: 'My learning pathway',
      team: 'SME workspace',
      evidence: 'Evidence lab',
      profile: 'My skills & profile',
    },
    explorePathwayAria: 'Explore your pathway',
    inclusiveFuture1: 'Built for a more',
    inclusiveFuture2: 'inclusive future of work.',
    syntheticDemoProfile: 'Synthetic demo profile',
    editProfileAria: 'Edit profile',
    workspaceBreadcrumb: ' / WORKSPACE',
    languageLabel: 'Language',
    hackathonPrototype: 'Hackathon prototype',
    resetDemo: 'Reset demo',
    openProfileAria: 'Open my profile',
    eyebrow: {
      team: 'GROW YOUR PEOPLE, TOGETHER',
      profile: 'YOUR EXPERIENCE IS A HEAD START',
      default: 'A LITTLE CLARITY FOR WHAT COMES NEXT',
    },
    pageTitle: {
      explore: 'Career command center',
      pathway: 'Your learning pathway',
      team: 'Workforce command center',
      evidence: 'Evidence intelligence',
      profile: 'Your skills & profile',
    },
    pageDesc: {
      explore: (name: string) =>
        `${name}, explore where your skills can take you across different AI futures.`,
      pathway:
        'A practical route that respects your time, budget and the skills you already have.',
      team: 'Connect individual growth to a thoughtful workforce learning plan.',
      evidence:
        'Every source has a date. Every assumption has an explanation.',
      profile:
        'Your skills, interests and constraints shape every recommendation.',
    },
    exploreAiFuture: 'EXPLORE AN AI FUTURE',
    moderateAdoption: 'Moderate adoption',
    rapidAdoption: 'Rapid adoption',
    planningScenariosNote: 'Planning scenarios, not predictions.',
    seeAssumptions: 'See assumptions',
    simulatedEvidence: 'Simulated evidence',
    publicEvidence: 'Public evidence',
    inspectSources: 'Inspect sources',
    stats: {
      careerOptions: 'Career options',
      sourcedOccupations: 'sourced occupations',
      transferableStrengths: 'Transferable strengths',
      skillsToBuildOn: 'skills to build on',
      learningRhythm: 'Your learning rhythm',
      hoursPerWeek: 'hours per week',
      courseBudget: 'Your course budget',
      overWeeks: (weeks: number) => `over ${weeks} weeks`,
    },
    possibilitiesConnected: 'YOUR POSSIBILITIES, CONNECTED',
    careerConstellation: 'Your career constellation',
    openFullPathwayAria: 'Open full learning pathway',
    yourSkillsRadar: 'Your skills radar',
    edit: 'Edit',
    selfReportedLevels: 'Self-reported levels · 0 to 3',
    nextUsefulStep: 'YOUR NEXT USEFUL STEP',
    reviewConstraintsFallback: 'Review your learning constraints',
    studyHoursProvider: (hours: number, provider: string) =>
      `${hours} study hours · ${provider}`,
    tryLongerHorizon: 'Try a longer horizon or inspect uncovered skills.',
    seeLearningPlan: 'See the learning plan',
    experienceValuable: 'Your experience stays valuable.',
    showTheBridge: 'We show the bridge, not a blank slate.',
    whereSkillsTakeYou: 'Where your skills could take you',
    rankedForScenario: (scenario: 'moderate' | 'rapid') =>
      `Ranked for your profile and the ${scenario} adoption scenario.`,
    showTopThree: 'Show top three',
    viewAllSix: 'View all six',
    searchCareerAria: 'Search career options',
    searchCareerPlaceholder: 'Find a career option…',
    topMatch: 'TOP MATCH',
    optionRank: (idx: number) => `OPTION ${idx}`,
    explainScoreAria: (title: string) => `Explain ${title} score`,
    suitability: 'Suitability',
    skillMatchPct: (pct: number) => `Skill match ${pct}%`,
    transferableSkillsCount: (n: number) => `${n} transferable skills`,
    gapsCount: (n: number) => `${n} gaps`,
    explorePathwayBtn: 'Explore pathway',
    noOccupationMatch: 'No occupation matches that search.',
    builtToAdapt: 'BUILT TO ADAPT',
    whatIfEvidenceChanges: 'What if the evidence changes?',
    tryNewerSnapshotDesc:
      'Try a newer demo snapshot and see exactly why the recommendations move.',
    tryReplanningDemo: 'Try the replanning demo',
    yourDestination: 'Your destination',
    courseFunding: 'Course funding',
    fundingAll: 'All verified options',
    fundingFree: 'Verified free',
    fundingHrd: 'Verified HRD Corp listed',
    exportPathway: 'Export pathway',
    followRecommendation:
      'Follow the leading recommendation as scenarios and evidence change',
    yourChosenRoute: 'YOUR CHOSEN ROUTE',
    routeMetricsSummary: (hours: number, cost: number, weeks: number) =>
      `${hours} planned hours · RM ${cost} in course fees · ${weeks}-week horizon`,
    courseCoverageAssumption:
      'Course coverage is a planning assumption. Study and assessment are needed to confirm proficiency.',
    whyThisRoute: 'Why this route?',
    hrdNotice:
      'No HRD Corp programme has been verified in this starter catalogue yet. Use verified free options, or verify an individual programme before adding it. Provider registration alone does not guarantee claimability.',
    checkHrdGuidance: 'Check HRD Corp guidance',
    sharedFoundationTag: 'Shared foundation',
    careerBranchTag: 'Career branch',
    weekRange: (start: number, end: number) =>
      `Week ${start}${end !== start ? `–${end}` : ''}`,
    hoursLabel: 'hours',
    durationKind: {
      provider: 'provider',
      'planning estimate': 'planning estimate',
    },
    openLearningResource: 'Open learning resource',
    markStudied: 'Mark studied',
    sourceChecked: (date: string) => `Source checked ${date}`,
    sdg44Label: 'SDG 4.4: relevant work skills',
    noNewCourseFits: 'No new course fits this selection.',
    noNewCourseDesc:
      'Review the available time, funding filter and gaps below. You may have already studied the relevant courses.',
    editConstraints: 'Edit constraints',
    learningKeeping: 'Learning you’re keeping',
    undo: 'Undo',
    markedStudiedNote:
      'Marked studied in this browser. Your assessed skill levels do not change automatically.',
    usefulStartGaps: 'A useful start, with gaps still to cover.',
    uncoveredGapsDesc:
      'These needs do not fit the available time, prerequisites or verified catalogue. Finishing the plan does not establish full role readiness.',
    makeRoomForLearning: 'MAKE ROOM FOR LEARNING',
    yourWeeklyRhythm: 'Your weekly rhythm',
    maxHoursPerWeek: (hours: number) => `Maximum ${hours} hours each week.`,
    first12WeeksShown:
      'First 12 weeks shown. Export includes the full schedule.',
    courseFees: 'Course fees',
    availableBudget: 'Available budget',
    separateCostsNote:
      'Device, software, data and staff-time costs are separate.',
    keepDestinationRealistic: 'Keep the destination realistic',
    exploreRoleRequirements: 'Explore role requirements',
    yourPlanCanAdapt: 'Your plan can adapt',
    planAdaptDesc: (count: number) =>
      `${count} occupation scores changed after the latest snapshot. Completed learning was retained. Manually chosen destinations stay pinned.`,
    inspectChanges: 'Inspect the changes',
    footerTagline: 'ArcTalent · Skills that travel with you.',
    footerSub:
      'Synthetic profiles · Human decisions · Evidence you can inspect',
    dismissNotificationAria: 'Dismiss notification',
    toasts: {
      snapshotActive:
        'This snapshot is already active. No recommendations changed.',
      snapshotApplied: (isSim: boolean) =>
        `${isSim ? 'Demo replay' : 'Public evidence'} applied. Scores and proposed pathways recalculated. Completed learning and manually chosen destinations are kept.`,
      refreshFailed: 'Refresh failed. Your snapshot has been kept.',
      demoReset: 'Demo reset to Aina’s starting profile.',
      learningUpdated:
        'Learning activity updated. Skill proficiency stays unchanged until you review it in your profile.',
      profileUpdated:
        'Profile updated. Your pathways now reflect these skills and constraints.',
    },
    overview: {
      selectedRouteAria: 'Selected route overview',
      selectedRoute: 'Selected route',
      overallRouteScore: 'Overall route score',
      ptsVsPrevious: (delta: string) => `${delta} pts vs previous snapshot`,
      noPriorComparison: 'Current snapshot · no prior comparison',
      currentSkillCoverage: 'Current skill coverage',
      leadingRoutes: 'Leading routes',
      score: 'Score',
      understandScore: 'Understand this score',
      planningEstimateNote: 'A planning estimate, not a hiring probability.',
      skillsScenarioFit: 'Skills & scenario fit',
      skillCoverage: 'Skill coverage',
      scenarioSuitability: 'Scenario suitability',
      modelledFitNote: 'Modelled fit for the active scenario; 0–100 scale.',
      learningAllocation: 'Learning allocation',
      firstNWeeks: (n: number) => `First ${n} weeks`,
      plannedAcrossWeeks: (n: number) => `planned across ${n} weeks`,
      weeklyCapacityNote: (hours: number) =>
        `Weekly capacity: ${hours} h · Proposed study, not completed activity.`,
      transferableStrengths: 'Transferable strengths',
      top3Routes: 'Top 3 routes',
      existingSkillsReusedNote:
        'Existing skills reused by each route; skills may overlap.',
    },
    map: {
      existingStrengths: 'Existing strengths',
      sharedFoundation: 'Shared foundation',
      careerBranches: 'Career branches',
      youAreHere: 'You are here',
      existingSkillsCount: (n: number) => `${n} existing skills`,
      sharedAcrossFutures: 'SHARED ACROSS FUTURES',
      yourSharedFoundation: 'Your shared foundation',
      noMissingSkillCommon:
        'No missing skill is common to every compared route. Explore each branch.',
      usefulAcrossTopRoutes: 'Useful across the top routes in both scenarios.',
      branchSpecificGaps: (n: number) => `${n} branch-specific gaps`,
      arcTalentApproach: 'The ArcTalent approach',
      mapCaptionDesc:
        'Start with skills that travel with you. Specialise when the next step is clearer.',
    },
    ui: {
      closeDialogAria: 'Close dialog',
      whyThisRoute: 'Why this route?',
      transparentEstimate:
        'A transparent suitability estimate, not a hiring probability.',
      currentSkills: 'Current skills',
      yourInterests: 'Your interests',
      evidenceSignal: 'Evidence signal',
      scenarioSuitability: 'Scenario suitability',
      weightLabel: (w: string) => `weight ${w}`,
      yourTransferableSkills: 'Your transferable skills',
      skillsToDevelop: 'Skills to develop',
      levelChange: (curr: number, req: number) => `Level ${curr} → ${req}`,
      onetAssumptionNote:
        'Role requirements and exposure factors are simplified team assumptions informed by occupational tasks. O*NET describes US occupations; Malaysian entry requirements need local validation.',
      occupationalSourceOnet: 'Occupational source: O*NET',
      sdgTarget: (t: string) => `SDG target ${t}`,
      radarAria:
        'Current self-reported skill levels, on a scale of zero to three',
    },
    bridge: {
      meetsTarget: 'Meets target',
      buildFurther: 'Build further',
      newSkill: 'New skill',
      startingPointFallback: 'Your starting point',
      title: 'Your transferable skill bridge',
      subtitle: 'See what carries across, and what comes next.',
      skillCoverage: 'skill coverage',
      meterAria: 'Coverage of assumed role skill requirements',
      meetTargetCount: 'Meet target',
      buildFurtherCount: 'Build further',
      learnFromScratchCount: 'Learn from scratch',
      skillUnit: (n: number) => (n === 1 ? 'skill' : 'skills'),
      inspectRequirements: (n: number) => `Inspect ${n} skill requirements`,
      tableCaption:
        'Self-reported current level compared with the assumed target. 0 Not yet · 1 Basic · 2 Independent · 3 Advanced.',
      colSkill: 'Skill',
      colCurrentTarget: 'Current → target',
      colNextStep: 'Next step',
      toSrOnly: ' to ',
      noRequirementsMapped:
        'No skill requirements have been mapped for this role.',
      bridgeNote:
        'Coverage compares your self-reported levels with the team’s simplified role requirements. It is not a qualification or a chance of getting hired.',
    },
    rhythm: {
      title: 'A rhythm for your week',
      noStudyTime: 'No study time set yet.',
      upTo: 'Up to ',
      sessionCount: (count: number, mins: number) =>
        `${count}-minute sessions`,
      plusOneRemainder: (hasFull: boolean, mins: number) =>
        `${hasFull ? ', plus ' : ''}one ${mins}-minute session`,
      eachWeek: ' each week.',
      dividesWeeklyLimit: (hours: number) =>
        `This divides your ${hours}-hour weekly limit. Use only the hours scheduled in your course plan.`,
      addWeeklyHoursPrompt:
        'Add weekly hours in your profile when you have time to begin.',
      practiceStyleFootnote:
        'Your chosen practice style does not change course hours or skill scores.',
      chooseSessionPrompt:
        'Choose a session length and a way to practise in the optional profile check.',
      editPreferences: 'Edit study preferences',
      findStudyRhythm: 'Find my study rhythm',
    },
    prefCheck: {
      bannerTitle: 'Make room for the way you learn.',
      bannerDesc:
        'Three questions to choose a work interest and a study rhythm that fits your week.',
      checkInFocus: 'Check-in focus:',
      minuteSessions: (mins: number) => `${mins}-minute sessions`,
      bannerFootnote:
        'Optional · about a minute. Answers are preferences, not an ability test. Save your profile below to update your pathways.',
      reviewMyAnswers: 'Review my answers',
      startQuickCheck: 'Start the quick check',
      clearPreferences: 'Clear study preferences',
      modalTitle: 'Your learning preferences',
      questionProgress: (step: number) => `Question ${step} of 3`,
      reviewProgress: 'Review your answers',
      steps: ['Work interest', 'Practice', 'Session length'],
      questions: [
        'Which problem would you enjoy working on?',
        'How would you like to practise?',
        'How long is a realistic study session?',
        'Your answers, your choice.',
      ],
      help: [
        'Pick the one that appeals most today. You can select more interests in your profile afterwards.',
        'This changes your practice suggestion. It does not measure how quickly you learn.',
        (hours: number) =>
          `Your weekly limit stays at ${hours} hours. Shorter sessions divide that time into smaller blocks.`,
        'Review what will change before applying these answers to your profile draft.',
      ] as [string, string, (hours: number) => string, string],
      minutesLabel: (mins: number) => `${mins} minutes`,
      minutesDetail: {
        15: 'A small window in a busy day.',
        30: 'A focused block with time to try something.',
        60: 'A longer block for deeper practice.',
      },
      selectedWorkInterest: 'Selected work interest',
      practicePreference: 'Practice preference',
      sessionLength: 'Session length',
      applyExplanation:
        'Applying replaces your current interest selections with this focus. You can adjust them below before saving. Your skill levels, completed learning, weekly hours and budget stay the same.',
      cancel: 'Cancel',
      back: 'Back',
      reviewAnswersBtn: 'Review answers',
      continueBtn: 'Continue',
      applyToProfileDraft: 'Apply to profile draft',
      chooseOneFootnote:
        'Choose one answer to continue, or cancel to keep your current profile.',
    },
    profilePanel: {
      startingPointEyebrow: 'YOUR STARTING POINT',
      experienceCounts: 'Experience counts.',
      demoNote:
        'Use a fictional profile for this hackathon demo. Confirm every inferred skill.',
      chooseSyntheticProfile: 'Choose a synthetic profile',
      displayName: 'Display name',
      currentRole: 'Current role',
      hoursPerWeek: 'Hours / week',
      budgetRm: 'Budget (RM)',
      planWeeks: 'Plan (weeks)',
      whatWorkInterests: 'What work interests you?',
      interests: {
        data: 'Data & insights',
        people: 'People & projects',
        operations: 'Business operations',
        sustainability: 'Sustainability',
      },
      yourCurrentSkills: 'Your current skills',
      skillScaleNote:
        '0 Not yet · 1 Basic · 2 Independent · 3 Advanced. Self-reported levels, not certifications.',
      skillLevels: [
        '0 · Not yet',
        '1 · Basic',
        '2 · Independent',
        '3 · Advanced',
      ],
      updatePathwaysBtn: 'Update my pathways',
      checkLimitsError: 'Check the name and numeric limits before saving.',
      optionalSyntheticCv: 'OPTIONAL · SYNTHETIC CV',
      discoverBuildingBlocks: 'Discover your building blocks.',
      importCvDesc:
        'Import a fictional CV or paste a short description of work experience.',
      downloadSampleTxt: 'Download the sample TXT',
      samplePdf: 'Sample PDF',
      syntheticConfirmCheckbox:
        'This is synthetic data, with no real personal information.',
      importSyntheticCv: 'Import a synthetic CV',
      fileFormatHint: 'Text PDF or TXT · up to 5 MB',
      cvTextareaAria: 'Synthetic CV text',
      cvPlaceholder:
        'Example: I prepare reports in Excel, coordinate scheduling and communicate with customers…',
      readingSample: 'Reading your sample…',
      findSkillsBtn: 'Find skills in this sample',
      addAsBasicBtn: 'Add as basic — review above',
      privacyNote:
        'Skill detection uses local word matching unless a RunPod model is configured. AI suggestions always need your confirmation. CV text is processed without being saved on the server.',
      cvMessages: {
        confirmFirst: 'Confirm that the CV is synthetic first.',
        confirmBeforeImport:
          'Confirm synthetic data before importing a file.',
        fileTooLarge: 'Choose a file smaller than 5 MB.',
        invalidFileType: 'Use a text PDF or .txt file.',
        txtImported: 'Text imported. Choose Find skills to review candidates.',
        pdfImported:
          'PDF text imported. Choose Find skills to review candidates.',
        readError: 'File could not be read. Paste its text instead.',
        reviewCandidates: (mode: string) =>
          `${mode}. Review these candidates and set your own skill levels below.`,
        extractionUnavailable: 'Extraction unavailable',
      },
    },
    employerPanel: {
      eyebrow: 'SYNTHETIC COMPANY · 8 PEOPLE',
      title: 'A stronger team starts with shared skills.',
      subtitle:
        'Explore internal opportunities. A manager and each employee decide what happens next.',
      exportPlan: 'Export plan',
      plannedLearners: 'Planned learners',
      plannedLearning: 'Planned learning',
      personHours: 'person-hours',
      trainingGroups: 'Training groups',
      sharedCourses: 'shared courses',
      heatmapTitle: 'Workforce skills heatmap',
      heatmapDesc: 'Each row is measured against its proposed destination role.',
      colTeamMember: 'Team member / destination',
      colPlanStatus: 'Plan status',
      destinationRoleAria: (name: string) => `Destination role for ${name}`,
      reasons: {
        noSlot: 'No internal slot',
        overBudget: 'Over team budget',
        partial: 'Partial learning route',
        fits: 'Learning route fits',
      },
      legendMeets: 'Current level meets model',
      legendOneGap: 'One level gap',
      legendTwoGap: 'Two level gap',
      legendNotRequired: '— Not required',
      planWithinConstraints: 'Plan within real constraints',
      companyBudgetLabel: 'Company training budget (RM)',
      budgetAllocationSummary: (allocated: number, remaining: number) =>
        `RM ${allocated} allocated · RM ${remaining} remaining. Catalogue fees are currently free; staff time and software costs are separate.`,
      proposedOpenings: 'Proposed internal openings',
      proposedOpeningsDesc:
        'Demo assumptions entered by the employer. These are not vacancies inferred from public job postings.',
      allocationHeuristicNotice:
        'Allocation follows the displayed worker order. It is a planning heuristic, not an optimum allocation or an employment decision.',
      learnTogether: 'Learn together',
      learnTogetherDesc:
        'Compatible needs grouped into the same verified learning resource.',
      groupMeta: (learners: number, hours: number, fee: number) =>
        `${learners} learners · ${hours} hours each · RM ${fee} each`,
      noTrainingFits:
        'No training fits the current slots and constraints. Increase capacity or choose a different role.',
      sdgEyebrow: 'SDG CONTRIBUTION PLAN',
      sdgTitle: 'Make the activity visible.',
      plannedSyntheticTag: 'Planned · synthetic',
      sdg4Title: 'Relevant work skills',
      sdg4Count: (n: number) => `${n} learners`,
      sdg4Desc: 'With at least one planned learning activity.',
      sdg4Link: 'Target 4.4',
      sdg8Title: 'Technological upgrading',
      sdg8Count: (n: number) => `${n} person-hours`,
      sdg8Desc: 'Proposed training time; productivity effects are unmeasured.',
      sdg8Link: 'Targets 8.2 & 8.5',
      sdg10Title: 'Accessible pathways',
      sdg10Count: (n: number) => `${n} free routes`,
      sdg10Desc:
        'At least one free activity; routes may still have uncovered gaps.',
      sdg10Link: 'Target 10.2',
      sdgDisclaimer:
        'These are overlapping activity counts, not official UN indicators. No jobs saved, employment outcomes or inequality reductions have been measured.',
    },
    evidencePanel: {
      eyebrow: 'EVIDENCE LAB',
      title: 'A recommendation should show its work.',
      subtitle:
        'Inspect the source, the assumption and the reason a pathway changed.',
      refreshTitle: 'Refresh public evidence',
      refreshDesc:
        'Fetch a bounded sample of European job postings from Arbeitnow and recent AI research from arXiv.',
      fetchingSources: 'Fetching sources…',
      refreshBtn: 'Refresh public sources',
      cacheNote: 'Five-minute cache · Sources may be unavailable',
      replanningTitle: 'See the replanning moment',
      replanningDesc:
        'Replay a dated synthetic shift in skill demand. The same engine recomputes the worker and team views.',
      applyNewerSnapshotBtn: 'Apply newer demo snapshot',
      restoreBaselineBtn: 'Restore baseline',
      simulatedNote: 'Clearly simulated. No invented market event.',
      snapshotPrefix: 'Snapshot',
      publicDataTag: 'Public data',
      simulationTag: 'Simulation',
      jobRecords: 'job records',
      researchRecords: 'research records',
      scoringModel: 'scoring model',
      sourceTypes: {
        research: 'AI RESEARCH',
        jobs: 'JOB POSTING',
        simulation: 'DEMO FIXTURE',
      },
      published: 'Published:',
      unknown: 'Unknown',
      collected: 'Collected:',
      showFewer: 'Show fewer',
      showAllRecords: (n: number) => `Show all ${n} records`,
      arbeitnowLink: 'Arbeitnow API & attribution',
      arxivLink: 'arXiv RSS documentation',
      whatChangedTitle: 'What changed, exactly?',
      whatChangedDesc: (prev: string, curr: string) =>
        `${prev} → ${curr}. Scores below use your current profile and scenario for both snapshots.`,
      evidenceModeChangedNotice:
        'The evidence mode changed. This comparison shows model sensitivity, not a measured market trend over time.',
      noMappedSignalChanged: 'No mapped signal changed',
      onlyEvidenceChangedNote:
        'Only the evidence component changed. Existing skills, interests and scenario exposure assumptions remain fixed in this comparison.',
      assumptionsTitle: 'Assumptions, in the open',
      suitabilityFormula:
        'Suitability = 55% skill coverage + 15% interest + 15% evidence + 15% scenario suitability.',
      twoPossibleFutures: 'Two possible futures',
      twoPossibleFuturesDesc:
        'Moderate uses an illustrative adoption factor of 0.35; rapid uses 0.75. Scenario suitability = 1 − adoption factor × task exposure. Neither factor is an unemployment probability.',
      evidenceQuality: 'Evidence quality',
      evidenceQualityDesc:
        'Live evidence uses skill mentions in one sample, with a neutral market score below 30 valid postings. Research is shown for interpretation, not treated as proof of automation. Reliable growth estimates need comparable historical windows.',
      roleExposureAssumptions: 'Role exposure assumptions',
      teamModelParamsNote:
        'Team-model parameters, not O*NET estimates. Role sources inform task context; they do not validate these values.',
    },
  },
  zh: {
    skipToContent: '跳转到主要内容',
    homeAria: 'ArcTalent 首页',
    brandTagline: '规划你的职业新篇章',
    yourWorkspace: '你的工作区',
    mainNavAria: '主导航',
    nav: {
      explore: '职业探索',
      pathway: '我的学习路径',
      team: '中小企业工作区',
      evidence: '证据实验室',
      profile: '我的技能与档案',
    },
    explorePathwayAria: '探索你的学习路径',
    inclusiveFuture1: '致力于构建更加',
    inclusiveFuture2: '包容的未来工作生态。',
    syntheticDemoProfile: '虚拟演示档案',
    editProfileAria: '编辑档案',
    workspaceBreadcrumb: ' / 工作区',
    languageLabel: '语言',
    hackathonPrototype: '黑客松原型演示',
    resetDemo: '重置演示',
    openProfileAria: '打开我的档案',
    eyebrow: {
      team: '凝聚团队，共同成长',
      profile: '你的过往经验就是领先优势',
      default: '为未来职业方向提供清晰指引',
    },
    pageTitle: {
      explore: '职业指挥中心',
      pathway: '你的学习路径',
      team: '团队人才指挥中心',
      evidence: '证据情报中心',
      profile: '你的技能与档案',
    },
    pageDesc: {
      explore: (name: string) =>
        `${name}，探索在不同的 AI 发展趋势下，你的技能可以带你走向何方。`,
      pathway: '充分尊重你的时间、预算与现有技能的实用学习路线。',
      team: '将个人成长与周密的团队培训计划紧密结合。',
      evidence: '每条数据来源均有日期标注，每项模型假设均有透明解释。',
      profile: '你的技能、兴趣和现实条件决定了每一项推荐结果。',
    },
    exploreAiFuture: '探索 AI 未来趋势',
    moderateAdoption: '温和普及',
    rapidAdoption: '快速普及',
    planningScenariosNote: '仅为规划情景，而非确定性预测。',
    seeAssumptions: '查看模型假设',
    simulatedEvidence: '模拟证据',
    publicEvidence: '公开数据证据',
    inspectSources: '查看数据来源',
    stats: {
      careerOptions: '职业选择',
      sourcedOccupations: '个有据可查的职业',
      transferableStrengths: '可迁移优势',
      skillsToBuildOn: '项可继续深化的技能',
      learningRhythm: '你的学习节奏',
      hoursPerWeek: '小时 / 周',
      courseBudget: '你的课程预算',
      overWeeks: (weeks: number) => `共 ${weeks} 周周期`,
    },
    possibilitiesConnected: '紧密相连的职业可能性',
    careerConstellation: '你的职业星图',
    openFullPathwayAria: '打开完整学习路径',
    yourSkillsRadar: '你的技能雷达',
    edit: '编辑',
    selfReportedLevels: '自评等级 · 0 至 3 级',
    nextUsefulStep: '下一步实用行动',
    reviewConstraintsFallback: '检查你的学习约束条件',
    studyHoursProvider: (hours: number, provider: string) =>
      `${hours} 学习小时 · ${provider}`,
    tryLongerHorizon: '尝试延长学习周期或查看未覆盖的技能。',
    seeLearningPlan: '查看学习计划',
    experienceValuable: '你的过往经验依然宝贵。',
    showTheBridge: '我们为你搭建转型桥梁，而非从零开始。',
    whereSkillsTakeYou: '你的技能可以带你走向何方',
    rankedForScenario: (scenario: 'moderate' | 'rapid') =>
      `根据你的档案及“${scenario === 'moderate' ? '温和普及' : '快速普及'}”情景排序。`,
    showTopThree: '仅显示前三项',
    viewAllSix: '查看全部六项',
    searchCareerAria: '搜索职业选择',
    searchCareerPlaceholder: '搜索职业方向…',
    topMatch: '最佳匹配',
    optionRank: (idx: number) => `备选 ${idx}`,
    explainScoreAria: (title: string) => `解释 ${title} 的评分`,
    suitability: '适配度',
    skillMatchPct: (pct: number) => `技能匹配 ${pct}%`,
    transferableSkillsCount: (n: number) => `${n} 项可迁移技能`,
    gapsCount: (n: number) => `${n} 项技能差距`,
    explorePathwayBtn: '探索学习路径',
    noOccupationMatch: '没有找到匹配该搜索词的职业。',
    builtToAdapt: '动态适应变化',
    whatIfEvidenceChanges: '如果市场证据发生变化会怎样？',
    tryNewerSnapshotDesc: '尝试应用更新的演示快照，直观了解推荐结果变化的原因。',
    tryReplanningDemo: '体验动态重规划演示',
    yourDestination: '你的目标职业',
    courseFunding: '课程资助类型',
    fundingAll: '所有已验证选项',
    fundingFree: '已验证免费课程',
    fundingHrd: '已验证 HRD Corp 课程',
    exportPathway: '导出学习路径',
    followRecommendation: '当情景和市场证据变化时，自动跟随排名第一的推荐职业',
    yourChosenRoute: '你选择的路线',
    routeMetricsSummary: (hours: number, cost: number, weeks: number) =>
      `计划 ${hours} 小时 · 课程费用 RM ${cost} · ${weeks} 周规划周期`,
    courseCoverageAssumption:
      '课程技能覆盖仅为规划假设，需通过实际学习与评估来确认熟练度。',
    whyThisRoute: '为什么推荐此路线？',
    hrdNotice:
      '此初始目录中尚未验证任何 HRD Corp 计划。请先使用已验证的免费课程，或在添加前核实具体课程。仅凭培训机构注册并不能保证可申请补贴。',
    checkHrdGuidance: '查看 HRD Corp 指南',
    sharedFoundationTag: '通用基础技能',
    careerBranchTag: '职业专属分支',
    weekRange: (start: number, end: number) =>
      `第 ${start}${end !== start ? `–${end}` : ''} 周`,
    hoursLabel: '小时',
    durationKind: {
      provider: '机构公布时长',
      'planning estimate': '规划估算时长',
    },
    openLearningResource: '打开学习资源',
    markStudied: '标记为已学',
    sourceChecked: (date: string) => `来源核验于 ${date}`,
    sdg44Label: 'SDG 4.4：相关工作技能',
    noNewCourseFits: '当前筛选条件下没有合适的新课程。',
    noNewCourseDesc:
      '请检查可用时间、资助筛选条件及下方技能差距。你也可能已经学完了相关课程。',
    editConstraints: '修改约束条件',
    learningKeeping: '已保留的学习记录',
    undo: '撤销',
    markedStudiedNote: '仅在此浏览器中标记为已学。你的自评技能等级不会自动改变。',
    usefulStartGaps: '良好的开端，但仍有部分技能差距待弥补。',
    uncoveredGapsDesc:
      '这些需求超出了当前可用时间、前置条件或已验证课程目录的范围。完成此计划并不代表完全具备岗位胜任力。',
    makeRoomForLearning: '为学习留出空间',
    yourWeeklyRhythm: '你的每周学习节奏',
    maxHoursPerWeek: (hours: number) => `每周最多 ${hours} 小时。`,
    first12WeeksShown: '仅展示前 12 周。导出文件包含完整日程。',
    courseFees: '课程费用',
    availableBudget: '可用预算',
    separateCostsNote: '设备、软件、网络流量及人员时间成本另计。',
    keepDestinationRealistic: '保持目标切实可行',
    exploreRoleRequirements: '查看职业要求详情',
    yourPlanCanAdapt: '你的计划可以动态调整',
    planAdaptDesc: (count: number) =>
      `最新快照更新后，有 ${count} 个职业评分发生了变化。已完成的学习记录已保留，手动选择的目标职业保持锁定。`,
    inspectChanges: '查看变化详情',
    footerTagline: 'ArcTalent · 伴随你同行的可迁移技能。',
    footerSub: '虚拟档案 · 人类自主决策 · 可供核验的透明证据',
    dismissNotificationAria: '关闭通知',
    toasts: {
      snapshotActive: '当前快照已处于激活状态，推荐结果未发生变化。',
      snapshotApplied: (isSim: boolean) =>
        `已应用${isSim ? '演示回放' : '公开证据'}。评分与建议路径已重新计算，已完成的学习和手动选择的目标职业已保留。`,
      refreshFailed: '刷新失败，已保留你当前的快照。',
      demoReset: '演示已重置为 Aina 的初始档案。',
      learningUpdated:
        '学习活动已更新。在你前往档案页面手动调整前，技能熟练度等级保持不变。',
      profileUpdated: '档案已更新。你的职业路径现已反映最新的技能与约束条件。',
    },
    overview: {
      selectedRouteAria: '所选路线概览',
      selectedRoute: '所选路线',
      overallRouteScore: '路线综合评分',
      ptsVsPrevious: (delta: string) => `较上一快照 ${delta} 分`,
      noPriorComparison: '当前快照 · 暂无历史对比',
      currentSkillCoverage: '当前技能覆盖率',
      leadingRoutes: '领先路线',
      score: '评分',
      understandScore: '了解此评分依据',
      planningEstimateNote: '仅为规划估算值，不代表录用概率。',
      skillsScenarioFit: '技能与情景契合度',
      skillCoverage: '技能覆盖率',
      scenarioSuitability: '情景适应度',
      modelledFitNote: '当前情景下的模型契合度；0–100 刻度。',
      learningAllocation: '学习时间分配',
      firstNWeeks: (n: number) => `前 ${n} 周`,
      plannedAcrossWeeks: (n: number) => `跨越 ${n} 周的计划学时`,
      weeklyCapacityNote: (hours: number) =>
        `每周上限：${hours} 小时 · 建议学习时间，非已完成学时。`,
      transferableStrengths: '可迁移优势',
      top3Routes: '前 3 条路线',
      existingSkillsReusedNote: '每条路线复用的现有技能数；技能可能重叠。',
    },
    map: {
      existingStrengths: '现有优势',
      sharedFoundation: '通用基础',
      careerBranches: '职业分支',
      youAreHere: '你的起点',
      existingSkillsCount: (n: number) => `${n} 项现有技能`,
      sharedAcrossFutures: '跨情景通用技能',
      yourSharedFoundation: '你的通用基础',
      noMissingSkillCommon: '所有对比路线中没有共同缺失的技能。请直接探索各分支。',
      usefulAcrossTopRoutes: '在两种情景的领先职业路线中均具实用价值。',
      branchSpecificGaps: (n: number) => `${n} 项分支特定差距`,
      arcTalentApproach: 'ArcTalent 方法论',
      mapCaptionDesc: '先掌握可随身迁移的核心技能，待方向更明确时再深入专精。',
    },
    ui: {
      closeDialogAria: '关闭对话框',
      whyThisRoute: '为什么推荐此路线？',
      transparentEstimate: '透明的适配度估算，而非录用概率预测。',
      currentSkills: '当前技能匹配',
      yourInterests: '个人兴趣契合',
      evidenceSignal: '市场证据信号',
      scenarioSuitability: '未来情景适应度',
      weightLabel: (w: string) => `权重 ${w}`,
      yourTransferableSkills: '你的可迁移技能',
      skillsToDevelop: '待提升的技能',
      levelChange: (curr: number, req: number) => `等级 ${curr} → ${req}`,
      onetAssumptionNote:
        '岗位技能要求与自动化暴露度是基于职业任务的简化团队假设。O*NET 描述的是美国职业数据；马来西亚本地入职要求需结合当地情况核实。',
      occupationalSourceOnet: '职业数据来源：O*NET',
      sdgTarget: (t: string) => `联合国可持续发展目标 SDG ${t}`,
      radarAria: '当前自评技能等级，范围从 0 到 3 级',
    },
    bridge: {
      meetsTarget: '达到目标',
      buildFurther: '继续提升',
      newSkill: '新技能',
      startingPointFallback: '你的起点',
      title: '你的可迁移技能桥梁',
      subtitle: '清晰查看哪些技能可以直接复用，哪些需要接下来学习。',
      skillCoverage: '技能覆盖率',
      meterAria: '假设岗位技能要求的覆盖比例',
      meetTargetCount: '已达目标',
      buildFurtherCount: '继续提升',
      learnFromScratchCount: '从零开始',
      skillUnit: () => '项技能',
      inspectRequirements: (n: number) => `查看 ${n} 项技能要求详情`,
      tableCaption:
        '自评当前等级与假设目标等级对比。0 未掌握 · 1 基础 · 2 独立应用 · 3 精通。',
      colSkill: '技能名称',
      colCurrentTarget: '当前 → 目标',
      colNextStep: '下一步行动',
      toSrOnly: ' 至 ',
      noRequirementsMapped: '该职业尚未映射任何技能要求。',
      bridgeNote:
        '覆盖率仅将你的自评等级与团队简化的岗位要求进行对比，不代表正式资质或录用机会。',
    },
    rhythm: {
      title: '适合你的一周学习节奏',
      noStudyTime: '尚未设置学习时间。',
      upTo: '每周最多 ',
      sessionCount: (_count: number, mins: number) => `次 ${mins} 分钟学习时段`,
      plusOneRemainder: (hasFull: boolean, mins: number) =>
        `${hasFull ? '，外加 ' : ''}1 次 ${mins} 分钟学习时段`,
      eachWeek: '。',
      dividesWeeklyLimit: (hours: number) =>
        `这将把你每周 ${hours} 小时的上限拆分为小段。实际只需按课程计划安排的学时学习即可。`,
      addWeeklyHoursPrompt: '当你准备好开始时，可在档案中添加每周可用学习小时数。',
      practiceStyleFootnote: '你选择的练习方式不会改变课程时长或技能评分。',
      chooseSessionPrompt: '在可选的档案偏好小测中选择单次学习时长与练习方式。',
      editPreferences: '修改学习偏好',
      findStudyRhythm: '探索我的学习节奏',
    },
    prefCheck: {
      bannerTitle: '为适合你的学习方式留出空间。',
      bannerDesc: '通过三个简短问题，选择契合你每周安排的工作兴趣和学习节奏。',
      checkInFocus: '当前偏好重点：',
      minuteSessions: (mins: number) => `${mins} 分钟单次学习`,
      bannerFootnote:
        '可选 · 约需一分钟。回答仅代表个人偏好，并非能力测试。完成后请在下方保存档案以更新路径。',
      reviewMyAnswers: '查看我的回答',
      startQuickCheck: '开始快速设定',
      clearPreferences: '清除学习偏好',
      modalTitle: '你的学习偏好设定',
      questionProgress: (step: number) => `第 ${step} / 3 题`,
      reviewProgress: '确认你的回答',
      steps: ['工作兴趣', '练习方式', '单次时长'],
      questions: [
        '你最喜欢处理哪类问题？',
        '你希望如何进行练习？',
        '单次学习多长时间对你来说最切实际？',
        '你的回答，由你做主。',
      ],
      help: [
        '选择今天最吸引你的一项。稍后你仍可在档案中勾选更多兴趣方向。',
        '这只会调整你的练习方式建议，不会衡量你的学习快慢。',
        (hours: number) =>
          `你每周的学习上限仍为 ${hours} 小时。较短的单次时长会将总时间拆分为更灵活的小块。`,
        '在将这些回答应用到档案草稿之前，请先确认以下变更。',
      ] as [string, string, (hours: number) => string, string],
      minutesLabel: (mins: number) => `${mins} 分钟`,
      minutesDetail: {
        15: '适合繁忙日程中的碎片时间。',
        30: '专注学习并动手尝试的适中时段。',
        60: '适合深入练习与思考的完整时段。',
      },
      selectedWorkInterest: '所选工作兴趣',
      practicePreference: '练习方式偏好',
      sessionLength: '单次学习时长',
      applyExplanation:
        '应用后将以此重点替换你当前的兴趣选择（保存前仍可在下方自由调整）。你的技能等级、已完成课程、每周时长与预算保持不变。',
      cancel: '取消',
      back: '返回',
      reviewAnswersBtn: '检查回答',
      continueBtn: '继续',
      applyToProfileDraft: '应用到档案草稿',
      chooseOneFootnote: '请选择一个选项以继续，或取消以保留当前档案。',
    },
    profilePanel: {
      startingPointEyebrow: '你的起点',
      experienceCounts: '过往经验至关重要。',
      demoNote: '在此黑客松演示中使用虚拟人物档案。请亲自确认每一项识别出的技能。',
      chooseSyntheticProfile: '选择一个虚拟人物档案',
      displayName: '显示名称',
      currentRole: '当前职位',
      hoursPerWeek: '每周学习小时数',
      budgetRm: '预算 (RM)',
      planWeeks: '计划周期 (周)',
      whatWorkInterests: '你对哪些工作领域感兴趣？',
      interests: {
        data: '数据与洞察',
        people: '人员与项目',
        operations: '业务运营',
        sustainability: '可持续发展',
      },
      yourCurrentSkills: '你当前的技能水平',
      skillScaleNote:
        '0 未掌握 · 1 基础 · 2 独立应用 · 3 精通。仅为个人自评等级，非认证资质。',
      skillLevels: ['0 · 未掌握', '1 · 基础', '2 · 独立应用', '3 · 精通'],
      updatePathwaysBtn: '更新我的职业路径',
      checkLimitsError: '保存前请检查姓名及数值范围限制。',
      optionalSyntheticCv: '可选 · 虚拟简历解析',
      discoverBuildingBlocks: '发掘你的技能基石。',
      importCvDesc: '导入一份虚拟简历，或粘贴一段简短的工作经历描述。',
      downloadSampleTxt: '下载示例 TXT',
      samplePdf: '示例 PDF',
      syntheticConfirmCheckbox: '我确认这是虚拟测试数据，不包含任何真实个人信息。',
      importSyntheticCv: '导入虚拟简历文件',
      fileFormatHint: '文本型 PDF 或 TXT · 最大 5 MB',
      cvTextareaAria: '虚拟简历文本',
      cvPlaceholder:
        '示例：我平时使用 Excel 制作报表、协调日程安排并与客户沟通…',
      readingSample: '正在读取样本…',
      findSkillsBtn: '从样本中识别技能',
      addAsBasicBtn: '添加为基础等级 — 请在上方复核',
      privacyNote:
        '除非配置了 RunPod 模型，否则技能识别使用本地关键词匹配。AI 建议始终需要你的人工确认。简历文本处理后不会保存在服务器上。',
      cvMessages: {
        confirmFirst: '请先勾选确认该简历为虚拟数据。',
        confirmBeforeImport: '导入文件前请先确认使用虚拟数据。',
        fileTooLarge: '请选择小于 5 MB 的文件。',
        invalidFileType: '请使用文本型 PDF 或 .txt 文件。',
        txtImported: '文本已导入。请点击“从样本中识别技能”查看候选技能。',
        pdfImported: 'PDF 文本已导入。请点击“从样本中识别技能”查看候选技能。',
        readError: '文件无法读取，请直接粘贴文本内容。',
        reviewCandidates: (mode: string) =>
          `${mode}。请复核以下候选技能，并在左侧设置你的实际技能等级。`,
        extractionUnavailable: '技能提取服务暂不可用',
      },
    },
    employerPanel: {
      eyebrow: '虚拟企业 · 8 名员工',
      title: '更强大的团队始于共享的技能。',
      subtitle: '探索内部转岗与成长机会。由管理者与每位员工共同决定下一步计划。',
      exportPlan: '导出培训计划',
      plannedLearners: '计划参训员工',
      plannedLearning: '计划学习总时长',
      personHours: '人时',
      trainingGroups: '共学培训小组',
      sharedCourses: '门共享课程',
      heatmapTitle: '团队技能热力图',
      heatmapDesc: '每一行均对照该员工拟定的目标职业进行评估。',
      colTeamMember: '团队成员 / 目标职业',
      colPlanStatus: '计划状态',
      destinationRoleAria: (name: string) => `${name} 的目标职业`,
      reasons: {
        noSlot: '无内部岗位名额',
        overBudget: '超出团队预算',
        partial: '部分学习路径覆盖',
        fits: '学习路径契合',
      },
      legendMeets: '当前等级达到模型要求',
      legendOneGap: '相差 1 个等级',
      legendTwoGap: '相差 2 个等级',
      legendNotRequired: '— 无需此技能',
      planWithinConstraints: '在真实约束条件下制定计划',
      companyBudgetLabel: '企业培训预算 (RM)',
      budgetAllocationSummary: (allocated: number, remaining: number) =>
        `已分配 RM ${allocated} · 剩余 RM ${remaining}。当前目录课程免费；员工时间与软件成本另计。`,
      proposedOpenings: '拟议内部岗位名额',
      proposedOpeningsDesc:
        '由雇主输入的演示假设名额，并非从公开招聘信息推断出的空缺职位。',
      allocationHeuristicNotice:
        '名额分配按列表显示的员工顺序进行。这只是规划启发式演示，并非最优分配方案或正式人事决定。',
      learnTogether: '结伴共学',
      learnTogetherDesc: '将具有相同技能需求的员工组合到同一已验证课程资源中。',
      groupMeta: (learners: number, hours: number, fee: number) =>
        `${learners} 名学员 · 每人 ${hours} 小时 · 每人 RM ${fee}`,
      noTrainingFits:
        '当前岗位名额与约束条件下暂无匹配的培训。请增加名额或选择其他目标职业。',
      sdgEyebrow: '联合国可持续发展目标 (SDG) 贡献计划',
      sdgTitle: '让培训行动清晰可见。',
      plannedSyntheticTag: '计划中 · 虚拟数据',
      sdg4Title: '相关工作技能',
      sdg4Count: (n: number) => `${n} 名学员`,
      sdg4Desc: '至少包含一项计划内的学习活动。',
      sdg4Link: '目标 4.4',
      sdg8Title: '技术升级与创新',
      sdg8Count: (n: number) => `${n} 人时`,
      sdg8Desc: '建议培训总时长；生产力提升效果未作量化测量。',
      sdg8Link: '目标 8.2 与 8.5',
      sdg10Title: '普惠可及的学习路径',
      sdg10Count: (n: number) => `${n} 条免费路径`,
      sdg10Desc: '至少包含一项免费学习活动；路径可能仍存在未覆盖的技能差距。',
      sdg10Link: '目标 10.2',
      sdgDisclaimer:
        '以上为存在重叠的活动统计数，并非联合国官方指标。未对保留岗位数、就业结果或不平等减少程度进行测量。',
    },
    evidencePanel: {
      eyebrow: '证据实验室',
      title: '每一项推荐都应展示其推导过程。',
      subtitle: '核查数据来源、模型假设以及职业路径发生变化的具体原因。',
      refreshTitle: '刷新公开数据证据',
      refreshDesc:
        '从 Arbeitnow 获取有限样本的欧洲招聘信息，并从 arXiv 获取最新 AI 研究论文。',
      fetchingSources: '正在获取数据源…',
      refreshBtn: '刷新公开数据源',
      cacheNote: '5 分钟缓存 · 外部数据源可能暂时不可用',
      replanningTitle: '见证动态重规划时刻',
      replanningDesc:
        '回放一个带日期的虚拟技能需求变化快照。同一引擎将重新计算个人与团队视图。',
      applyNewerSnapshotBtn: '应用较新的演示快照',
      restoreBaselineBtn: '恢复基准快照',
      simulatedNote: '明确标注为模拟数据，绝不虚构真实市场事件。',
      snapshotPrefix: '快照',
      publicDataTag: '公开数据',
      simulationTag: '模拟数据',
      jobRecords: '条招聘记录',
      researchRecords: '条研究记录',
      scoringModel: '评分模型',
      sourceTypes: {
        research: 'AI 研究论文',
        jobs: '招聘职位',
        simulation: '演示样本',
      },
      published: '发布时间：',
      unknown: '未知',
      collected: '采集时间：',
      showFewer: '收起部分记录',
      showAllRecords: (n: number) => `显示全部 ${n} 条记录`,
      arbeitnowLink: 'Arbeitnow API 与来源说明',
      arxivLink: 'arXiv RSS 文档',
      whatChangedTitle: '具体发生了哪些变化？',
      whatChangedDesc: (prev: string, curr: string) =>
        `${prev} → ${curr}。下方评分均基于你当前的个人档案和情景设置进行对比。`,
      evidenceModeChangedNotice:
        '证据模式已切换。此对比仅展示模型敏感度，而非跨时间的真实市场趋势。',
      noMappedSignalChanged: '映射的技能信号未发生变化',
      onlyEvidenceChangedNote:
        '仅市场证据分项发生了变化。现有技能、个人兴趣和情景暴露度假设在此对比中保持不变。',
      assumptionsTitle: '公开透明的模型假设',
      suitabilityFormula:
        '综合适配度 = 55% 技能覆盖率 + 15% 兴趣契合 + 15% 市场证据 + 15% 情景适应度。',
      twoPossibleFutures: '两种可能的未来情景',
      twoPossibleFuturesDesc:
        '温和普及使用 0.35 的说明性采纳系数；快速普及使用 0.75。情景适应度 = 1 − 采纳系数 × 任务暴露度。这两个系数均不代表失业概率。',
      evidenceQuality: '证据质量说明',
      evidenceQualityDesc:
        '实时证据统计单次样本中的技能提及率，有效职位少于 30 条时采用中性市场得分。研究论文仅供背景参考，不作为自动化替代的证据。可靠的增长估算需要可比的历史时间窗口。',
      roleExposureAssumptions: '岗位暴露度假设参数',
      teamModelParamsNote:
        '以上为团队模型参数，并非 O*NET 官方估算值。职业来源仅提供任务背景参考，并不验证这些数值。',
    },
  },
  ms: {
    skipToContent: 'Langkau ke kandungan utama',
    homeAria: 'Laman utama ArcTalent',
    brandTagline: 'BINA BAB KERJAYA SETERUSNYA',
    yourWorkspace: 'RUANG KERJA ANDA',
    mainNavAria: 'Navigasi utama',
    nav: {
      explore: 'Peneroka kerjaya',
      pathway: 'Laluan pembelajaran saya',
      team: 'Ruang kerja PKS',
      evidence: 'Makmal bukti',
      profile: 'Kemahiran & profil saya',
    },
    explorePathwayAria: 'Terokai laluan anda',
    inclusiveFuture1: 'Dibina untuk masa depan kerja',
    inclusiveFuture2: 'yang lebih inklusif.',
    syntheticDemoProfile: 'Profil demo sintetik',
    editProfileAria: 'Sunting profil',
    workspaceBreadcrumb: ' / RUANG KERJA',
    languageLabel: 'Bahasa',
    hackathonPrototype: 'Prototaip hackathon',
    resetDemo: 'Tetapkan semula demo',
    openProfileAria: 'Buka profil saya',
    eyebrow: {
      team: 'MAJUKAN PASUKAN ANDA, BERSAMA-SAMA',
      profile: 'PENGALAMAN ANDA IALAH PERMULAAN YANG KUKUH',
      default: 'KEJELASAN UNTUK LANGKAH SETERUSNYA',
    },
    pageTitle: {
      explore: 'Pusat kawalan kerjaya',
      pathway: 'Laluan pembelajaran anda',
      team: 'Pusat kawalan tenaga kerja',
      evidence: 'Perisikan bukti',
      profile: 'Kemahiran & profil anda',
    },
    pageDesc: {
      explore: (name: string) =>
        `${name}, terokai ke mana kemahiran anda boleh membawa anda merentasi pelbagai senario masa depan AI.`,
      pathway:
        'Laluan praktikal yang menghormati masa, bajet dan kemahiran yang sudah anda miliki.',
      team: 'Hubungkan perkembangan individu dengan pelan pembelajaran tenaga kerja yang teliti.',
      evidence:
        'Setiap sumber mempunyai tarikh. Setiap andaian mempunyai penjelasan.',
      profile:
        'Kemahiran, minat dan kekangan anda mencorakkan setiap cadangan.',
    },
    exploreAiFuture: 'TEROKAI MASA DEPAN AI',
    moderateAdoption: 'Penerimaan sederhana',
    rapidAdoption: 'Penerimaan pesat',
    planningScenariosNote: 'Senario perancangan, bukan ramalan.',
    seeAssumptions: 'Lihat andaian',
    simulatedEvidence: 'Bukti simulasi',
    publicEvidence: 'Bukti awam',
    inspectSources: 'Periksa sumber',
    stats: {
      careerOptions: 'Pilihan kerjaya',
      sourcedOccupations: 'pekerjaan bersumber',
      transferableStrengths: 'Kekuatan boleh pindah',
      skillsToBuildOn: 'kemahiran sedia ada',
      learningRhythm: 'Rentak pembelajaran anda',
      hoursPerWeek: 'jam seminggu',
      courseBudget: 'Bajet kursus anda',
      overWeeks: (weeks: number) => `sepanjang ${weeks} minggu`,
    },
    possibilitiesConnected: 'PELUANG ANDA, SALING BERHUBUNG',
    careerConstellation: 'Buruj kerjaya anda',
    openFullPathwayAria: 'Buka laluan pembelajaran penuh',
    yourSkillsRadar: 'Radar kemahiran anda',
    edit: 'Sunting',
    selfReportedLevels: 'Tahap penilaian kendiri · 0 hingga 3',
    nextUsefulStep: 'LANGKAH BERGUNA SETERUSNYA',
    reviewConstraintsFallback: 'Semak kekangan pembelajaran anda',
    studyHoursProvider: (hours: number, provider: string) =>
      `${hours} jam belajar · ${provider}`,
    tryLongerHorizon:
      'Cuba tempoh yang lebih panjang atau periksa kemahiran yang belum diliputi.',
    seeLearningPlan: 'Lihat pelan pembelajaran',
    experienceValuable: 'Pengalaman anda kekal bernilai.',
    showTheBridge: 'Kami tunjukkan jambatan, bukan bermula daripada kosong.',
    whereSkillsTakeYou: 'Ke mana kemahiran anda boleh membawa anda',
    rankedForScenario: (scenario: 'moderate' | 'rapid') =>
      `Disusun mengikut profil anda dan senario penerimaan ${scenario === 'moderate' ? 'sederhana' : 'pesat'}.`,
    showTopThree: 'Tunjuk tiga teratas',
    viewAllSix: 'Lihat kesemua enam',
    searchCareerAria: 'Cari pilihan kerjaya',
    searchCareerPlaceholder: 'Cari pilihan kerjaya…',
    topMatch: 'PADANAN TERBAIK',
    optionRank: (idx: number) => `PILIHAN ${idx}`,
    explainScoreAria: (title: string) => `Terangkan skor ${title}`,
    suitability: 'Kesesuaian',
    skillMatchPct: (pct: number) => `Padanan kemahiran ${pct}%`,
    transferableSkillsCount: (n: number) => `${n} kemahiran boleh pindah`,
    gapsCount: (n: number) => `${n} jurang kemahiran`,
    explorePathwayBtn: 'Terokai laluan',
    noOccupationMatch: 'Tiada pekerjaan yang sepadan dengan carian tersebut.',
    builtToAdapt: 'DIBINA UNTUK MENYESUAI',
    whatIfEvidenceChanges: 'Bagaimana jika bukti berubah?',
    tryNewerSnapshotDesc:
      'Cuba gambaran data demo yang lebih baharu dan lihat sebab cadangan berubah.',
    tryReplanningDemo: 'Cuba demo perancangan semula',
    yourDestination: 'Destinasi anda',
    courseFunding: 'Pembiayaan kursus',
    fundingAll: 'Semua pilihan disahkan',
    fundingFree: 'Percuma & disahkan',
    fundingHrd: 'Tersenarai HRD Corp disahkan',
    exportPathway: 'Eksport laluan',
    followRecommendation:
      'Ikuti cadangan utama apabila senario dan bukti berubah',
    yourChosenRoute: 'LALUAN PILIHAN ANDA',
    routeMetricsSummary: (hours: number, cost: number, weeks: number) =>
      `${hours} jam dirancang · RM ${cost} yuran kursus · tempoh ${weeks} minggu`,
    courseCoverageAssumption:
      'Liputan kursus ialah andaian perancangan. Pembelajaran dan penilaian diperlukan untuk mengesahkan penguasaan.',
    whyThisRoute: 'Mengapa laluan ini?',
    hrdNotice:
      'Tiada program HRD Corp telah disahkan dalam katalog permulaan ini lagi. Gunakan pilihan percuma yang disahkan, atau sahkan program individu sebelum menambahkannya. Pendaftaran penyedia sahaja tidak menjamin kelayakan tuntutan.',
    checkHrdGuidance: 'Semak panduan HRD Corp',
    sharedFoundationTag: 'Asas bersama',
    careerBranchTag: 'Cabang kerjaya',
    weekRange: (start: number, end: number) =>
      `Minggu ${start}${end !== start ? `–${end}` : ''}`,
    hoursLabel: 'jam',
    durationKind: {
      provider: 'penyedia',
      'planning estimate': 'anggaran perancangan',
    },
    openLearningResource: 'Buka sumber pembelajaran',
    markStudied: 'Tandakan telah dipelajari',
    sourceChecked: (date: string) => `Sumber disemak ${date}`,
    sdg44Label: 'SDG 4.4: kemahiran kerja relevan',
    noNewCourseFits: 'Tiada kursus baharu yang sesuai dengan pilihan ini.',
    noNewCourseDesc:
      'Semak masa yang ada, penapis pembiayaan dan jurang di bawah. Anda mungkin sudah mempelajari kursus yang berkaitan.',
    editConstraints: 'Sunting kekangan',
    learningKeeping: 'Pembelajaran yang anda simpan',
    undo: 'Buat asal',
    markedStudiedNote:
      'Ditandakan telah dipelajari dalam pelayar ini. Tahap kemahiran anda tidak berubah secara automatik.',
    usefulStartGaps: 'Permulaan yang berguna, dengan jurang yang masih perlu ditutup.',
    uncoveredGapsDesc:
      'Keperluan ini tidak muat dalam masa yang ada, prasyarat atau katalog yang disahkan. Menamatkan pelan ini tidak bermakna kesediaan penuh untuk peranan tersebut.',
    makeRoomForLearning: 'LUANGKAN MASA UNTUK BELAJAR',
    yourWeeklyRhythm: 'Rentak mingguan anda',
    maxHoursPerWeek: (hours: number) => `Maksimum ${hours} jam setiap minggu.`,
    first12WeeksShown:
      '12 minggu pertama ditunjukkan. Eksport mengandungi jadual penuh.',
    courseFees: 'Yuran kursus',
    availableBudget: 'Bajet tersedia',
    separateCostsNote:
      'Kos peranti, perisian, data dan masa kakitangan adalah berasingan.',
    keepDestinationRealistic: 'Kekalkan destinasi yang realistik',
    exploreRoleRequirements: 'Terokai keperluan peranan',
    yourPlanCanAdapt: 'Pelan anda boleh menyesuaikan diri',
    planAdaptDesc: (count: number) =>
      `${count} skor pekerjaan berubah selepas gambaran data terkini. Pembelajaran yang selesai dikekalkan. Destinasi pilihan manual kekal ditetapkan.`,
    inspectChanges: 'Periksa perubahan',
    footerTagline: 'ArcTalent · Kemahiran yang bergerak bersama anda.',
    footerSub:
      'Profil sintetik · Keputusan manusia · Bukti yang boleh anda periksa',
    dismissNotificationAria: 'Tutup pemberitahuan',
    toasts: {
      snapshotActive:
        'Gambaran data ini sudah aktif. Tiada cadangan yang berubah.',
      snapshotApplied: (isSim: boolean) =>
        `${isSim ? 'Main semula demo' : 'Bukti awam'} digunakan. Skor dan cadangan laluan dikira semula. Pembelajaran selesai dan destinasi pilihan manual dikekalkan.`,
      refreshFailed: 'Muat semula gagal. Gambaran data anda telah dikekalkan.',
      demoReset: 'Demo ditetapkan semula kepada profil permulaan Aina.',
      learningUpdated:
        'Aktiviti pembelajaran dikemas kini. Tahap kemahiran kekal tidak berubah sehingga anda menyemaknya dalam profil anda.',
      profileUpdated:
        'Profil dikemas kini. Laluan anda kini mencerminkan kemahiran dan kekangan baharu ini.',
    },
    overview: {
      selectedRouteAria: 'Gambaran keseluruhan laluan terpilih',
      selectedRoute: 'Laluan terpilih',
      overallRouteScore: 'Skor keseluruhan laluan',
      ptsVsPrevious: (delta: string) =>
        `${delta} mata berbanding gambaran data sebelumnya`,
      noPriorComparison: 'Gambaran data semasa · tiada perbandingan terdahulu',
      currentSkillCoverage: 'Liputan kemahiran semasa',
      leadingRoutes: 'Laluan utama',
      score: 'Skor',
      understandScore: 'Fahami skor ini',
      planningEstimateNote: 'Anggaran perancangan, bukan kebarangkalian diambil bekerja.',
      skillsScenarioFit: 'Kesesuaian kemahiran & senario',
      skillCoverage: 'Liputan kemahiran',
      scenarioSuitability: 'Kesesuaian senario',
      modelledFitNote: 'Kesesuaian model untuk senario aktif; skala 0–100.',
      learningAllocation: 'Peruntukan pembelajaran',
      firstNWeeks: (n: number) => `${n} minggu pertama`,
      plannedAcrossWeeks: (n: number) => `dirancang merentasi ${n} minggu`,
      weeklyCapacityNote: (hours: number) =>
        `Kapasiti mingguan: ${hours} j · Cadangan waktu belajar, bukan aktiviti yang telah selesai.`,
      transferableStrengths: 'Kekuatan boleh pindah',
      top3Routes: '3 laluan teratas',
      existingSkillsReusedNote:
        'Kemahiran sedia ada yang digunakan semula oleh setiap laluan; kemahiran mungkin bertindih.',
    },
    map: {
      existingStrengths: 'Kekuatan sedia ada',
      sharedFoundation: 'Asas bersama',
      careerBranches: 'Cabang kerjaya',
      youAreHere: 'Anda di sini',
      existingSkillsCount: (n: number) => `${n} kemahiran sedia ada`,
      sharedAcrossFutures: 'DIKONGSI MERENTASI MASA DEPAN',
      yourSharedFoundation: 'Asas bersama anda',
      noMissingSkillCommon:
        'Tiada kemahiran yang kurang secara sepunya bagi setiap laluan. Terokai setiap cabang.',
      usefulAcrossTopRoutes:
        'Berguna merentasi laluan utama dalam kedua-dua senario.',
      branchSpecificGaps: (n: number) => `${n} jurang khusus cabang`,
      arcTalentApproach: 'Pendekatan ArcTalent',
      mapCaptionDesc:
        'Mulakan dengan kemahiran yang bergerak bersama anda. Pengkhususan apabila langkah seterusnya lebih jelas.',
    },
    ui: {
      closeDialogAria: 'Tutup dialog',
      whyThisRoute: 'Mengapa laluan ini?',
      transparentEstimate:
        'Anggaran kesesuaian yang telus, bukan kebarangkalian diambil bekerja.',
      currentSkills: 'Kemahiran semasa',
      yourInterests: 'Minat anda',
      evidenceSignal: 'Isyarat bukti',
      scenarioSuitability: 'Kesesuaian senario',
      weightLabel: (w: string) => `pemberat ${w}`,
      yourTransferableSkills: 'Kemahiran boleh pindah anda',
      skillsToDevelop: 'Kemahiran untuk dibangunkan',
      levelChange: (curr: number, req: number) => `Tahap ${curr} → ${req}`,
      onetAssumptionNote:
        'Keperluan peranan dan faktor pendedahan ialah andaian pasukan yang dipermudah berdasarkan tugas pekerjaan. O*NET menerangkan pekerjaan AS; keperluan kemasukan di Malaysia memerlukan pengesahan tempatan.',
      occupationalSourceOnet: 'Sumber pekerjaan: O*NET',
      sdgTarget: (t: string) => `Sasaran SDG ${t}`,
      radarAria:
        'Tahap kemahiran penilaian kendiri semasa, pada skala sifar hingga tiga',
    },
    bridge: {
      meetsTarget: 'Menepati sasaran',
      buildFurther: 'Bina lebih lanjut',
      newSkill: 'Kemahiran baharu',
      startingPointFallback: 'Titik permulaan anda',
      title: 'Jambatan kemahiran boleh pindah anda',
      subtitle: 'Lihat apa yang boleh dibawa bersama, dan apa yang seterusnya.',
      skillCoverage: 'liputan kemahiran',
      meterAria: 'Liputan keperluan kemahiran peranan yang diandaikan',
      meetTargetCount: 'Menepati sasaran',
      buildFurtherCount: 'Bina lebih lanjut',
      learnFromScratchCount: 'Belajar dari asas',
      skillUnit: () => 'kemahiran',
      inspectRequirements: (n: number) => `Periksa ${n} keperluan kemahiran`,
      tableCaption:
        'Tahap semasa penilaian kendiri berbanding sasaran yang diandaikan. 0 Belum lagi · 1 Asas · 2 Berdikari · 3 Maju.',
      colSkill: 'Kemahiran',
      colCurrentTarget: 'Semasa → sasaran',
      colNextStep: 'Langkah seterusnya',
      toSrOnly: ' hingga ',
      noRequirementsMapped:
        'Tiada keperluan kemahiran telah dipetakan untuk peranan ini.',
      bridgeNote:
        'Liputan membandingkan tahap penilaian kendiri anda dengan keperluan peranan mudah pasukan. Ia bukan kelayakan rasmi atau jaminan mendapat pekerjaan.',
    },
    rhythm: {
      title: 'Rentak untuk minggu anda',
      noStudyTime: 'Tiada masa belajar ditetapkan lagi.',
      upTo: 'Sehingga ',
      sessionCount: (_count: number, mins: number) =>
        `sesi ${mins} minit`,
      plusOneRemainder: (hasFull: boolean, mins: number) =>
        `${hasFull ? ', tambah ' : ''}satu sesi ${mins} minit`,
      eachWeek: ' setiap minggu.',
      dividesWeeklyLimit: (hours: number) =>
        `Ini membahagikan had mingguan ${hours} jam anda. Gunakan hanya jam yang dijadualkan dalam pelan kursus anda.`,
      addWeeklyHoursPrompt:
        'Tambahkan jam mingguan dalam profil anda apabila anda mempunyai masa untuk bermula.',
      practiceStyleFootnote:
        'Gaya latihan pilihan anda tidak mengubah jam kursus atau skor kemahiran.',
      chooseSessionPrompt:
        'Pilih tempoh sesi dan cara berlatih dalam semakan profil pilihan.',
      editPreferences: 'Sunting pilihan belajar',
      findStudyRhythm: 'Cari rentak belajar saya',
    },
    prefCheck: {
      bannerTitle: 'Luangkan ruang untuk cara anda belajar.',
      bannerDesc:
        'Tiga soalan untuk memilih minat kerja dan rentak belajar yang sesuai dengan minggu anda.',
      checkInFocus: 'Fokus pilihan:',
      minuteSessions: (mins: number) => `sesi ${mins} minit`,
      bannerFootnote:
        'Pilihan · kira-kira seminit. Jawapan ialah keutamaan peribadi, bukan ujian kebolehan. Simpan profil anda di bawah untuk mengemas kini laluan anda.',
      reviewMyAnswers: 'Semak jawapan saya',
      startQuickCheck: 'Mulakan semakan pantas',
      clearPreferences: 'Kosongkan pilihan belajar',
      modalTitle: 'Pilihan pembelajaran anda',
      questionProgress: (step: number) => `Soalan ${step} daripada 3`,
      reviewProgress: 'Semak jawapan anda',
      steps: ['Minat kerja', 'Latihan', 'Tempoh sesi'],
      questions: [
        'Masalah manakah yang anda seronok selesaikan?',
        'Bagaimanakah anda ingin berlatih?',
        'Berapa lamakah sesi belajar yang realistik?',
        'Jawapan anda, pilihan anda.',
      ],
      help: [
        'Pilih satu yang paling menarik hari ini. Anda boleh memilih lebih banyak minat dalam profil anda selepas ini.',
        'Ini mengubah cadangan latihan anda. Ia tidak mengukur kepantasan anda belajar.',
        (hours: number) =>
          `Had mingguan anda kekal pada ${hours} jam. Sesi yang lebih pendek membahagikan masa itu kepada blok yang lebih kecil.`,
        'Semak perubahan sebelum menggunakan jawapan ini pada draf profil anda.',
      ] as [string, string, (hours: number) => string, string],
      minutesLabel: (mins: number) => `${mins} minit`,
      minutesDetail: {
        15: 'Ruang masa singkat dalam hari yang sibuk.',
        30: 'Blok masa berfokus dengan ruang untuk mencuba sesuatu.',
        60: 'Blok masa lebih panjang untuk latihan mendalam.',
      },
      selectedWorkInterest: 'Minat kerja terpilih',
      practicePreference: 'Pilihan latihan',
      sessionLength: 'Tempoh sesi',
      applyExplanation:
        'Penggunaan ini menggantikan pilihan minat semasa anda dengan fokus ini. Anda boleh melaraskannya di bawah sebelum menyimpan. Tahap kemahiran, pembelajaran selesai, jam mingguan dan bajet anda kekal sama.',
      cancel: 'Batal',
      back: 'Kembali',
      reviewAnswersBtn: 'Semak jawapan',
      continueBtn: 'Teruskan',
      applyToProfileDraft: 'Gunakan pada draf profil',
      chooseOneFootnote:
        'Pilih satu jawapan untuk meneruskan, atau batal untuk mengekalkan profil semasa anda.',
    },
    profilePanel: {
      startingPointEyebrow: 'TITIK PERMULAAN ANDA',
      experienceCounts: 'Pengalaman diambil kira.',
      demoNote:
        'Gunakan profil rekaan untuk demo hackathon ini. Sahkan setiap kemahiran yang dikenal pasti.',
      chooseSyntheticProfile: 'Pilih profil sintetik',
      displayName: 'Nama paparan',
      currentRole: 'Peranan semasa',
      hoursPerWeek: 'Jam / minggu',
      budgetRm: 'Bajet (RM)',
      planWeeks: 'Pelan (minggu)',
      whatWorkInterests: 'Apakah bidang kerja yang menarik minat anda?',
      interests: {
        data: 'Data & wawasan',
        people: 'Manusia & projek',
        operations: 'Operasi perniagaan',
        sustainability: 'Kelestarian',
      },
      yourCurrentSkills: 'Kemahiran semasa anda',
      skillScaleNote:
        '0 Belum lagi · 1 Asas · 2 Berdikari · 3 Maju. Tahap penilaian kendiri, bukan pensijilan.',
      skillLevels: [
        '0 · Belum lagi',
        '1 · Asas',
        '2 · Berdikari',
        '3 · Maju',
      ],
      updatePathwaysBtn: 'Kemas kini laluan saya',
      checkLimitsError: 'Semak nama dan had nombor sebelum menyimpan.',
      optionalSyntheticCv: 'PILIHAN · CV SINTETIK',
      discoverBuildingBlocks: 'Temui blok binaan kemahiran anda.',
      importCvDesc:
        'Import CV rekaan atau tampal penerangan ringkas pengalaman kerja.',
      downloadSampleTxt: 'Muat turun sampel TXT',
      samplePdf: 'Sampel PDF',
      syntheticConfirmCheckbox:
        'Ini ialah data sintetik, tanpa maklumat peribadi sebenar.',
      importSyntheticCv: 'Import CV sintetik',
      fileFormatHint: 'PDF teks atau TXT · sehingga 5 MB',
      cvTextareaAria: 'Teks CV sintetik',
      cvPlaceholder:
        'Contoh: Saya menyediakan laporan dalam Excel, menyelaraskan jadual dan berkomunikasi dengan pelanggan…',
      readingSample: 'Membaca sampel anda…',
      findSkillsBtn: 'Cari kemahiran dalam sampel ini',
      addAsBasicBtn: 'Tambah sebagai asas — semak di atas',
      privacyNote:
        'Pengesanan kemahiran menggunakan padanan perkataan tempatan melainkan model RunPod dikonfigurasikan. Cadangan AI sentiasa memerlukan pengesahan anda. Teks CV diproses tanpa disimpan di pelayan.',
      cvMessages: {
        confirmFirst: 'Sahkan bahawa CV adalah sintetik terlebih dahulu.',
        confirmBeforeImport: 'Sahkan data sintetik sebelum mengimport fail.',
        fileTooLarge: 'Pilih fail yang lebih kecil daripada 5 MB.',
        invalidFileType: 'Gunakan fail PDF teks atau .txt.',
        txtImported:
          'Teks diimport. Pilih Cari kemahiran untuk menyemak calon kemahiran.',
        pdfImported:
          'Teks PDF diimport. Pilih Cari kemahiran untuk menyemak calon kemahiran.',
        readError: 'Fail tidak dapat dibaca. Tampal teksnya secara terus.',
        reviewCandidates: (mode: string) =>
          `${mode}. Semak calon kemahiran ini dan tetapkan tahap kemahiran anda di bawah.`,
        extractionUnavailable: 'Pengekstrakan tidak tersedia',
      },
    },
    employerPanel: {
      eyebrow: 'SYARIKAT SINTETIK · 8 ORANG',
      title: 'Pasukan yang lebih kukuh bermula dengan kemahiran bersama.',
      subtitle:
        'Terokai peluang dalaman. Pengurus dan setiap pekerja membuat keputusan bersama.',
      exportPlan: 'Eksport pelan',
      plannedLearners: 'Pelajar dirancang',
      plannedLearning: 'Pembelajaran dirancang',
      personHours: 'jam-orang',
      trainingGroups: 'Kumpulan latihan',
      sharedCourses: 'kursus dikongsi',
      heatmapTitle: 'Peta haba kemahiran tenaga kerja',
      heatmapDesc:
        'Setiap baris diukur berbanding peranan destinasi yang dicadangkan.',
      colTeamMember: 'Ahli pasukan / destinasi',
      colPlanStatus: 'Status pelan',
      destinationRoleAria: (name: string) =>
        `Peranan destinasi untuk ${name}`,
      reasons: {
        noSlot: 'Tiada slot dalaman',
        overBudget: 'Melebihi bajet pasukan',
        partial: 'Laluan pembelajaran separa',
        fits: 'Laluan pembelajaran sesuai',
      },
      legendMeets: 'Tahap semasa menepati model',
      legendOneGap: 'Jurang satu tahap',
      legendTwoGap: 'Jurang dua tahap',
      legendNotRequired: '— Tidak diperlukan',
      planWithinConstraints: 'Rancang dalam kekangan sebenar',
      companyBudgetLabel: 'Bajet latihan syarikat (RM)',
      budgetAllocationSummary: (allocated: number, remaining: number) =>
        `RM ${allocated} diperuntukkan · RM ${remaining} berbaki. Yuran katalog buat masa ini adalah percuma; masa kakitangan dan kos perisian adalah berasingan.`,
      proposedOpenings: 'Cadangan kekosongan dalaman',
      proposedOpeningsDesc:
        'Andaian demo yang dimasukkan oleh majikan. Ini bukan kekosongan jawatan daripada iklan kerja awam.',
      allocationHeuristicNotice:
        'Peruntukan mengikut susunan pekerja yang dipaparkan. Ia adalah heuristik perancangan, bukan peruntukan optimum atau keputusan pekerjaan.',
      learnTogether: 'Belajar bersama-sama',
      learnTogetherDesc:
        'Keperluan yang serasi dikumpulkan ke dalam sumber pembelajaran disahkan yang sama.',
      groupMeta: (learners: number, hours: number, fee: number) =>
        `${learners} pelajar · ${hours} jam seorang · RM ${fee} seorang`,
      noTrainingFits:
        'Tiada latihan yang sesuai dengan slot dan kekangan semasa. Tambah kapasiti atau pilih peranan lain.',
      sdgEyebrow: 'PELAN SUMBANGAN SDG',
      sdgTitle: 'Jadikan aktiviti dapat dilihat.',
      plannedSyntheticTag: 'Dirancang · sintetik',
      sdg4Title: 'Kemahiran kerja relevan',
      sdg4Count: (n: number) => `${n} pelajar`,
      sdg4Desc: 'Dengan sekurang-kurangnya satu aktiviti pembelajaran dirancang.',
      sdg4Link: 'Sasaran 4.4',
      sdg8Title: 'Penaiktarafan teknologi',
      sdg8Count: (n: number) => `${n} jam-orang`,
      sdg8Desc: 'Masa latihan dicadangkan; kesan produktiviti tidak diukur.',
      sdg8Link: 'Sasaran 8.2 & 8.5',
      sdg10Title: 'Laluan mudah diakses',
      sdg10Count: (n: number) => `${n} laluan percuma`,
      sdg10Desc:
        'Sekurang-kurangnya satu aktiviti percuma; laluan mungkin masih mempunyai jurang.',
      sdg10Link: 'Sasaran 10.2',
      sdgDisclaimer:
        'Ini adalah kiraan aktiviti yang bertindih, bukan penunjuk rasmi PBB. Tiada pekerjaan yang diselamatkan, hasil pekerjaan atau pengurangan ketidaksamaan yang telah diukur.',
    },
    evidencePanel: {
      eyebrow: 'MAKMAL BUKTI',
      title: 'Setiap cadangan harus menunjukkan buktinya.',
      subtitle:
        'Periksa sumber, andaian dan sebab sesuatu laluan berubah.',
      refreshTitle: 'Muat semula bukti awam',
      refreshDesc:
        'Dapatkan sampel terhad iklan kerja Eropah daripada Arbeitnow dan penyelidikan AI terkini daripada arXiv.',
      fetchingSources: 'Mendapatkan sumber…',
      refreshBtn: 'Muat semula sumber awam',
      cacheNote: 'Cache lima minit · Sumber mungkin tidak tersedia',
      replanningTitle: 'Lihat detik perancangan semula',
      replanningDesc:
        'Main semula anjakan sintetik bertarikh dalam permintaan kemahiran. Enjin yang sama mengira semula pandangan pekerja dan pasukan.',
      applyNewerSnapshotBtn: 'Gunakan gambaran data demo baharu',
      restoreBaselineBtn: 'Pulihkan garis asas',
      simulatedNote: 'Jelas disimulasikan. Tiada peristiwa pasaran yang direka.',
      snapshotPrefix: 'Gambaran data',
      publicDataTag: 'Data awam',
      simulationTag: 'Simulasi',
      jobRecords: 'rekod kerja',
      researchRecords: 'rekod penyelidikan',
      scoringModel: 'model pemarkahan',
      sourceTypes: {
        research: 'PENYELIDIKAN AI',
        jobs: 'IKLAN KERJA',
        simulation: 'DATA DEMO',
      },
      published: 'Diterbitkan:',
      unknown: 'Tidak diketahui',
      collected: 'Dikumpul:',
      showFewer: 'Tunjuk lebih sedikit',
      showAllRecords: (n: number) => `Tunjuk semua ${n} rekod`,
      arbeitnowLink: 'API & atribusi Arbeitnow',
      arxivLink: 'Dokumentasi RSS arXiv',
      whatChangedTitle: 'Apakah yang berubah secara tepat?',
      whatChangedDesc: (prev: string, curr: string) =>
        `${prev} → ${curr}. Skor di bawah menggunakan profil dan senario semasa anda untuk kedua-dua gambaran data.`,
      evidenceModeChangedNotice:
        'Mod bukti telah berubah. Perbandingan ini menunjukkan kepekaan model, bukan trend pasaran sebenar mengikut masa.',
      noMappedSignalChanged: 'Tiada isyarat terpetakan yang berubah',
      onlyEvidenceChangedNote:
        'Hanya komponen bukti yang berubah. Kemahiran sedia ada, minat dan andaian pendedahan senario kekal tetap dalam perbandingan ini.',
      assumptionsTitle: 'Andaian secara terbuka',
      suitabilityFormula:
        'Kesesuaian = 55% liputan kemahiran + 15% minat + 15% bukti + 15% kesesuaian senario.',
      twoPossibleFutures: 'Dua kemungkinan masa depan',
      twoPossibleFuturesDesc:
        'Sederhana menggunakan faktor penerimaan ilustrasi 0.35; pesat menggunakan 0.75. Kesesuaian senario = 1 − faktor penerimaan × pendedahan tugas. Kedua-dua faktor bukan kebarangkalian pengangguran.',
      evidenceQuality: 'Kualiti bukti',
      evidenceQualityDesc:
        'Bukti langsung menggunakan sebutan kemahiran dalam satu sampel, dengan skor pasaran neutral di bawah 30 iklan sah. Penyelidikan ditunjukkan untuk tafsiran, bukan bukti automasi. Anggaran pertumbuhan yang boleh dipercayai memerlukan tetingkap sejarah yang setanding.',
      roleExposureAssumptions: 'Andaian pendedahan peranan',
      teamModelParamsNote:
        'Parameter model pasukan, bukan anggaran O*NET. Sumber peranan memberi konteks tugas; ia tidak mengesahkan nilai ini.',
    },
  },
};

const snapshotTranslations: Record<
  Language,
  Record<string, { label: string; note: string }>
> = {
  en: {},
  zh: {
    'demo-2026-10-19': {
      label: '演示基准快照',
      note: '说明性情景样本。数值仅为模型假设，并非经测量的真实就业市场需求。',
    },
    'demo-2026-10-22': {
      label: '较新的演示快照',
      note: '带日期的虚拟更新用于演示模型敏感度，并不代表该日期发生了真实市场事件。',
    },
    live: {
      label: '公开证据快照',
      note: '欧洲小型样本中的当前技能提及占比。排名使用已记录的可见度启发式公式（0.5 + 占比）。这并非增长率、预测或马来西亚本地职位需求。研究论文仅提供背景参考，不会自动改变暴露度假设。',
    },
    liveLow: {
      label: '公开证据快照',
      note: '少于 30 条招聘记录：市场分项保持中性，证据不足以进行比较。',
    },
  },
  ms: {
    'demo-2026-10-19': {
      label: 'Garis asas demo',
      note: 'Data senario ilustrasi. Nilai adalah andaian, bukan permintaan pasaran kerja yang diukur.',
    },
    'demo-2026-10-22': {
      label: 'Gambaran data demo baharu',
      note: 'Kemas kini sintetik bertarikh menunjukkan kepekaan model. Ia bukan tuntutan tentang peristiwa sebenar pada tarikh ini.',
    },
    live: {
      label: 'Gambaran data bukti awam',
      note: 'Bahagian sebutan kemahiran semasa dalam sampel kecil Eropah. Kedudukan menggunakan heuristik keterlihatan yang didokumenkan (0.5 + bahagian). Ini bukan pertumbuhan, ramalan atau permintaan jawatan kosong di Malaysia.',
    },
    liveLow: {
      label: 'Gambaran data bukti awam',
      note: 'Kurang daripada 30 rekod kerja: komponen pasaran adalah neutral. Bukti tidak mencukupi untuk perbandingan.',
    },
  },
};

const signalTranslations: Record<
  Language,
  Record<string, { title?: string; geography?: string }>
> = {
  en: {},
  zh: {
    'demo-a': {
      title: '报表编制与项目协调的说明性需求',
      geography: '虚拟演示；非真实市场声明',
    },
    'demo-b': {
      title: '向利益相关者沟通与运营变革转移的模拟趋势',
      geography: '虚拟演示；非真实市场声明',
    },
  },
  ms: {
    'demo-a': {
      title: 'Permintaan ilustrasi untuk pelaporan dan penyelarasan',
      geography: 'Demo sintetik; tiada tuntutan pasaran',
    },
    'demo-b': {
      title: 'Anjakan simulasi ke arah kerja pihak berkepentingan dan perubahan operasi',
      geography: 'Demo sintetik; tiada tuntutan pasaran',
    },
  },
};

export type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  dateLocale: string;
  t: (typeof dictionaries)['en'];
  skillLabel: (id: SkillId) => string;
  skillRationale: (id: SkillId) => string;
  roleText: (role: Role) => Role;
  courseText: (course: Course) => Course;
  snapshotText: (snapshot: Snapshot) => { label: string; note: string };
  signalText: (signal: Signal) => { title: string; geography: string };
  translateCurrentRole: (role: string) => string;
  focusOptions: readonly FocusOption[];
  formatOptions: readonly FormatOption[];
};

const LanguageContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('arctalent-lang');
      if (saved === 'en' || saved === 'zh' || saved === 'ms') {
        setLangState(saved);
      }
    } catch {
      /* Storage is optional. */
    }
  }, []);

  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[0];
    document.documentElement.lang = meta.htmlLang;
    try {
      localStorage.setItem('arctalent-lang', lang);
    } catch {
      /* Storage is optional. */
    }
  }, [lang]);

  const meta = LANGUAGES.find((l) => l.id === lang) ?? LANGUAGES[0];
  const t = dictionaries[lang];

  const value: I18nContextValue = {
    lang,
    setLang: setLangState,
    dateLocale: meta.dateLocale,
    t,
    skillLabel: (id: SkillId) =>
      skillTranslations[lang]?.[id]?.label ?? skillById[id].label,
    skillRationale: (id: SkillId) =>
      skillTranslations[lang]?.[id]?.rationale ?? skillById[id].rationale,
    roleText: (role: Role): Role => {
      const tr = roleTranslations[lang]?.[role.id];
      return tr ? { ...role, ...tr } : role;
    },
    courseText: (course: Course): Course => {
      const tr = courseTranslations[lang]?.[course.id];
      return tr ? { ...course, ...tr } : course;
    },
    snapshotText: (snapshot: Snapshot) => {
      if (lang === 'en') return { label: snapshot.label, note: snapshot.note };
      const tr =
        snapshotTranslations[lang]?.[snapshot.id] ??
        (snapshot.kind === 'live'
          ? snapshot.sampleSize >= 30
            ? snapshotTranslations[lang]?.live
            : snapshotTranslations[lang]?.liveLow
          : undefined);
      return {
        label: tr?.label ?? snapshot.label,
        note: tr?.note ?? snapshot.note,
      };
    },
    signalText: (signal: Signal) => {
      if (lang === 'en')
        return { title: signal.title, geography: signal.geography };
      const tr = signalTranslations[lang]?.[signal.id];
      let geography = tr?.geography ?? signal.geography;
      if (!tr?.geography) {
        if (signal.geography.includes('Arbeitnow Europe')) {
          geography =
            lang === 'zh'
              ? 'Arbeitnow 欧洲样本；非马来西亚本地需求'
              : 'Sampel Eropah Arbeitnow; bukan permintaan Malaysia';
        } else if (signal.geography.includes('Global research')) {
          geography =
            lang === 'zh'
              ? '全球研究论文；非直接采纳证据'
              : 'Penyelidikan global; bukan bukti penerimaan';
        }
      }
      return {
        title: tr?.title ?? signal.title,
        geography,
      };
    },
    translateCurrentRole: (role: string) =>
      currentRoleTranslations[lang]?.[role] ?? role,
    focusOptions: focusTranslations[lang],
    formatOptions: formatTranslations[lang],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): I18nContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
