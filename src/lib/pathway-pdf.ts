import PDFDocument from 'pdfkit';
import path from 'node:path';
import { z } from 'zod';
import { profileSchema, snapshotSchema, careerGoalSchema } from './validation';
import {
  buildPlan,
  MODEL_VERSION,
  rankRoles,
  sharedFoundation,
} from './engine';
import { goalCandidates } from './career-goals';
import { skillById } from './catalogue';
import { buildStudyRhythm, formatOptions } from './learning-preferences';
import { translate, type TranslationValues } from './i18n';

export const pathwayExportSchema = z
  .object({
    profile: profileSchema,
    scenario: z.enum(['moderate', 'rapid']),
    snapshot: snapshotSchema,
    customGoal: careerGoalSchema.nullish(),
    roleId: z.string().max(100),
    funding: z.enum(['all', 'free', 'hrd']).default('all'),
    locale: z.enum(['en', 'ms', 'zh-CN']).default('en'),
  })
  .refine(
    (input) =>
      goalCandidates(input.customGoal ?? null).some(
        (role) => role.id === input.roleId,
      ),
    {
      message: 'Unknown career destination',
      path: ['roleId'],
    },
  );

/** Recompute the displayed plan from validated inputs; never accept supplied courses or URLs. */
export function renderPathwayPdf(
  input: z.infer<typeof pathwayExportSchema>,
  generated = new Date(),
): Promise<Buffer> {
  const candidates = goalCandidates(input.customGoal ?? null);
  const match = rankRoles(
    input.profile,
    input.scenario,
    input.snapshot,
    candidates,
  ).find((row) => row.role.id === input.roleId)!;
  const shared = sharedFoundation(input.profile, input.snapshot, candidates);
  const plan = buildPlan(input.profile, match.role, shared, input.funding);
  const t = (source: string, values?: TranslationValues) =>
    translate(input.locale, source, values);
  const date = (value: Date) =>
    new Intl.DateTimeFormat(
      input.locale === 'en'
        ? 'en-MY'
        : input.locale === 'ms'
          ? 'ms-MY'
          : 'zh-CN',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kuala_Lumpur',
      },
    ).format(value) + ' MYT';
  return new Promise((resolve, reject) => {
    let doc: PDFKit.PDFDocument | undefined;
    try {
      doc = new PDFDocument({
        size: 'A4',
        margins: { left: 40, right: 40, top: 80, bottom: 78 },
        font: path.join(process.cwd(), 'assets/fonts/NotoSansSC-Regular.otf'),
        bufferPages: true,
        info: {
          Title: `ArcTalent - ${t('Your learning pathway')}`,
          Author: 'ArcTalent',
          CreationDate: generated,
        },
      });
      const pdf = doc,
        chunks: Buffer[] = [],
        width = pdf.page.width - 80;
      pdf.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      pdf.on('error', reject);
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      let y = 80;
      const clean = (value: string) =>
        value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
      const height = (value: string, size: number) =>
        pdf.fontSize(size).heightOfString(clean(value), { width, lineGap: 2 });
      function ensure(amount: number) {
        if (y + amount > pdf.page.height - 78) {
          pdf.addPage();
          y = 80;
        }
      }
      function text(
        value: string,
        size = 10,
        color = '#17203B',
        link?: string,
      ) {
        ensure(height(value, size) + 9);
        pdf
          .fontSize(size)
          .fillColor(color)
          .text(clean(value), 40, y, {
            width,
            lineGap: 2,
            ...(link ? { link, underline: true } : {}),
          });
        y = pdf.y + 9;
      }
      function section(value: string) {
        ensure(70);
        y += 8;
        text(t(value), 14, '#5320CA');
      }
      const skillNames = (ids: (keyof typeof skillById)[]) =>
        ids.map((id) => t(skillById[id].label)).join(', ');
      text(t('Your learning pathway'), 23);
      text(`${input.profile.name} | ${input.profile.currentRole}`, 12);
      text(
        match.role.custom ? match.role.title : t(match.role.title),
        17,
        '#5320CA',
      );
      text(`${t('Generated')}: ${date(generated)}`, 8, '#59647C');
      text(
        `${t('Scenario')}: ${t(input.scenario === 'rapid' ? 'Rapid adoption' : 'Moderate adoption')}`,
      );
      text(
        `${t('Evidence snapshot')}: ${t(input.snapshot.label)} | ${date(new Date(input.snapshot.asOf))}`,
        9,
        '#59647C',
      );
      text(
        t(
          input.snapshot.kind === 'live'
            ? 'Public evidence'
            : 'Simulated evidence',
        ),
        9,
        '#007A8C',
      );
      text(`${t('Overall route score')}: ${match.score}/100`, 10);
      text(t('A planning estimate, not a hiring probability.'), 9, '#59647C');
      text(
        t('{0} hours per week over {1} weeks; personal course budget RM {2}.', {
          0: input.profile.hours,
          1: input.profile.weeks,
          2: input.profile.budget,
        }),
        10,
      );
      text(
        `${t('Planned hours')}: ${plan.totalHours} | ${t('Course fees')}: RM ${plan.totalCost.toFixed(2)}`,
        11,
      );
      text(
        `${t('Course funding')}: ${t(input.funding === 'hrd' ? 'Verified HRD Corp listed' : input.funding === 'free' ? 'Verified free' : 'All verified options')}`,
        9,
        '#59647C',
      );
      section('Shared foundation');
      text(skillNames(shared) || t('None'));
      text(t('Useful across the top routes in both scenarios.'), 9, '#59647C');
      section('Current skill gaps (current / target)');
      const gaps = match.gaps.filter((gap) => gap.gap > 0);
      text(
        gaps
          .map(
            (gap) =>
              `${t(skillById[gap.id].label)} (${gap.current}/${gap.required})`,
          )
          .join(', ') || t('None'),
        9,
      );
      if (match.role.custom) {
        text(
          t(
            'Your learning targets are editable planning assumptions, not official role requirements.',
          ),
          9,
          '#59647C',
        );
        if (input.customGoal?.otherSkills.length)
          text(
            t('Specialist skills not covered: {0}', {
              0: input.customGoal.otherSkills.join('; '),
            }),
            10,
          );
      }
      section('Learning schedule');
      if (!plan.steps.length)
        text(t('No new learning is scheduled for this person.'), 10);
      for (const [index, step] of plan.steps.entries()) {
        ensure(
          height(step.course.title, 12) + height(step.course.url, 8) + 115,
        );
        text(
          `${String(index + 1).padStart(2, '0')} | ${t(step.shared ? 'Shared foundation' : 'Career branch')} | ${t('Week {0}-{1}', { 0: step.startWeek, 1: step.endWeek })}`,
          9,
          '#5320CA',
        );
        text(step.course.title, 12);
        text(
          `${step.course.provider} | ${step.course.hours} ${t('hours')} (${t(step.course.durationKind)}) | RM ${step.course.fee.toFixed(2)}`,
          9,
          '#59647C',
        );
        text(step.course.url, 8, '#007A8C', step.course.url);
        text(`${t('Source checked')} ${step.course.checkedAt}`, 8, '#59647C');
        if (step.course.note) text(t(step.course.note), 8, '#59647C');
      }
      if (plan.completed.length) {
        section('Already studied');
        for (const course of plan.completed)
          text(course.title, 9, '#007A8C', course.url);
      }
      if (plan.uncovered.length) {
        section('Skills still to cover');
        text(skillNames(plan.uncovered), 10);
      }
      section('Your weekly rhythm');
      text(
        Array.from({ length: input.profile.weeks }, (_, index) =>
          t('Week {0}: {1} hours', {
            0: index + 1,
            1: plan.weeks[index]?.hours ?? 0,
          }),
        ).join(' | '),
        9,
      );
      const preferences = input.profile.learningPreferences;
      if (preferences) {
        const rhythm = buildStudyRhythm(
          input.profile.hours,
          preferences.sessionMinutes,
        );
        section('A rhythm for your week');
        text(
          `${t('Session length')}: ${preferences.sessionMinutes} ${t('minutes')}`,
          10,
        );
        text(
          rhythm.totalMinutes === 0
            ? t('No study time set yet.')
            : rhythm.fullSessions > 0
              ? rhythm.remainderMinutes > 0
                ? t(
                    'Up to {0} × {1}-minute sessions, plus one {2}-minute session each week.',
                    {
                      0: rhythm.fullSessions,
                      1: rhythm.fullSessionMinutes,
                      2: rhythm.remainderMinutes,
                    },
                  )
                : t('Up to {0} × {1}-minute sessions each week.', {
                    0: rhythm.fullSessions,
                    1: rhythm.fullSessionMinutes,
                  })
              : t('Up to one {0}-minute session each week.', {
                  0: rhythm.remainderMinutes,
                }),
          9,
        );
        const format = formatOptions.find(
          (option) => option.value === preferences.format,
        )!;
        text(`${t(format.label)}: ${t(format.tip)}`, 9);
        if (preferences.workAnswer)
          text(`${t('Your work goal')}: ${preferences.workAnswer}`, 9);
        if (preferences.practiceAnswer)
          text(`${t('Your practice idea')}: ${preferences.practiceAnswer}`, 9);
        text(
          t(
            'Your chosen practice style does not change course hours or skill scores.',
          ),
          9,
          '#59647C',
        );
      }
      section('Planning assumptions');
      text(
        t(
          'Course coverage is a planning assumption. Study and assessment are needed to confirm proficiency.',
        ),
        9,
        '#59647C',
      );
      text(
        t('Device, software, data and staff-time costs are separate.'),
        9,
        '#59647C',
      );
      text(t('Planning scenarios, not predictions.'), 9, '#59647C');
      if (input.snapshot.note) text(t(input.snapshot.note), 9, '#59647C');
      text(
        `${t('Model')}: ${MODEL_VERSION} | ${t('Snapshot')}: ${input.snapshot.id}`,
        8,
        '#59647C',
      );
      const range = pdf.bufferedPageRange();
      for (let index = 0; index < range.count; index++) {
        pdf.switchToPage(index);
        pdf
          .fontSize(10)
          .fillColor('#5320CA')
          .text('ArcTalent', 40, 32, { lineBreak: false });
        pdf
          .moveTo(40, 55)
          .lineTo(40 + width, 55)
          .lineWidth(0.5)
          .strokeColor('#DFE3EF')
          .stroke();
        const bottom = pdf.page.margins.bottom;
        pdf.page.margins.bottom = 0;
        pdf
          .fontSize(8)
          .fillColor('#59647C')
          .text(t('Your learning pathway'), 40, pdf.page.height - 52, {
            lineBreak: false,
          });
        pdf.text(
          t('Page {0} of {1}', { 0: index + 1, 1: range.count }),
          40,
          pdf.page.height - 52,
          { width, align: 'right', lineBreak: false },
        );
        pdf.page.margins.bottom = bottom;
      }
      pdf.end();
    } catch (error) {
      doc?.destroy();
      reject(error);
    }
  });
}
