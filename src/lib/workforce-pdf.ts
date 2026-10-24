import PDFDocument from 'pdfkit';
import path from 'node:path';
import { z } from 'zod';
import { profileSchema, snapshotSchema } from './validation';
import { workforceSettingsSchema } from './workforce-settings';
import { buildWorkforcePlan } from './workforce-plan';
import { translate, type Locale, type TranslationValues } from './i18n';
import { skillById } from './catalogue';
import { MODEL_VERSION } from './engine';

export const workforceExportSchema = z.object({
  profile: profileSchema,
  workforce: workforceSettingsSchema,
  scenario: z.enum(['moderate', 'rapid']),
  snapshot: snapshotSchema,
  locale: z.enum(['en', 'ms', 'zh-CN']).default('en'),
});
type ExportInput = z.infer<typeof workforceExportSchema>;
const font = path.join(
  process.cwd(),
  'assets',
  'fonts',
  'NotoSansSC-Regular.otf',
);
const colors = {
  ink: '#17203B',
  muted: '#59647C',
  line: '#DFE3EF',
  purple: '#5320CA',
  pale: '#F3F1FB',
  cyan: '#007A8C',
};
const clean = (text: string) =>
  text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
const inline = (text: string) => clean(text).replace(/\s+/g, ' ').trim();

/** A standalone, searchable PDF. No model, remote font or external fetch is used. */
export function renderWorkforcePdf(
  input: ExportInput,
  generated = new Date(),
): Promise<Buffer> {
  const plan = buildWorkforcePlan(
    input.profile,
    input.scenario,
    input.snapshot,
    input.workforce,
  );
  const t = (source: string, values?: TranslationValues) =>
    translate(input.locale as Locale, source, values);
  const dateLocale =
    input.locale === 'en' ? 'en-MY' : input.locale === 'ms' ? 'ms-MY' : 'zh-CN';
  const date = (value: Date) =>
    new Intl.DateTimeFormat(dateLocale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kuala_Lumpur',
    }).format(value) + ' MYT';
  return new Promise((resolve, reject) => {
    let doc: PDFKit.PDFDocument | undefined;
    try {
      doc = new PDFDocument({
        size: 'A4',
        margins: { left: 40, right: 40, top: 80, bottom: 82 },
        font,
        bufferPages: true,
        info: {
          Title: `ArcTalent - ${t('Workforce learning plan')}`,
          Author: 'ArcTalent',
          Creator: 'ArcTalent',
          CreationDate: generated,
        },
      });
      const pdf = doc;
      const chunks: Buffer[] = [];
      pdf.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      pdf.on('error', reject);
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      const left = 40,
        width = pdf.page.width - 80;
      const bottom = () => pdf.page.height - 82;
      let y = 80;
      const height = (text: string, size: number, w = width) =>
        pdf
          .fontSize(size)
          .heightOfString(clean(text), { width: w, lineGap: 2 });
      function ensure(h: number) {
        if (y + h > bottom()) {
          pdf.addPage();
          y = 80;
        }
      }
      function text(
        value: string,
        size = 10,
        color = colors.ink,
        gap = 8,
        link?: string,
      ) {
        const valueClean = clean(value),
          h = height(valueClean, size);
        ensure(h + gap);
        pdf
          .fontSize(size)
          .fillColor(color)
          .text(valueClean, left, y, {
            width,
            lineGap: 2,
            ...(link ? { link, underline: true } : {}),
          });
        y = pdf.y + gap;
      }
      function section(value: string) {
        ensure(65);
        y += 10;
        text(t(value), 15, colors.purple, 12);
      }
      function rule() {
        ensure(14);
        pdf
          .moveTo(left, y)
          .lineTo(left + width, y)
          .lineWidth(0.5)
          .strokeColor(colors.line)
          .stroke();
        y += 14;
      }
      type Line = {
        value: string;
        size: number;
        color: string;
        gap: number;
        link?: string;
      };
      function block(lines: Line[], reserve = 0) {
        ensure(
          lines.reduce(
            (sum, line) => sum + height(line.value, line.size) + line.gap,
            reserve,
          ),
        );
        lines.forEach((line) =>
          text(line.value, line.size, line.color, line.gap, line.link),
        );
      }
      function metrics() {
        ensure(108);
        const items = [
          [t('Team members'), String(plan.team.length)],
          [t('Planned learners'), String(plan.learners)],
          [t('Planned learning'), `${plan.hours} ${t('person-hours')}`],
          [
            t('Company training budget (RM)'),
            input.workforce.budget.toFixed(2),
          ],
        ];
        const w = (width - 24) / 4;
        items.forEach(([label, value], i) => {
          const x = left + i * (w + 8);
          pdf.roundedRect(x, y, w, 96, 7).fill(colors.pale);
          pdf
            .fontSize(8)
            .fillColor(colors.muted)
            .text(label, x + 10, y + 10, { width: w - 20, lineGap: 1 });
          pdf
            .fontSize(14)
            .fillColor(colors.purple)
            .text(value, x + 10, y + 57, { width: w - 20 });
        });
        y += 108;
      }

      text(t('Workforce learning plan'), 23, colors.ink, 10);
      text(
        t(
          'Synthetic team. Proposed learning activities, not employment decisions.',
        ),
        10,
        colors.muted,
      );
      text(`${t('Generated')}: ${date(generated)}`, 8, colors.muted);
      text(
        `${t('Scenario')}: ${t(input.scenario === 'rapid' ? 'Rapid adoption' : 'Moderate adoption')}`,
        10,
      );
      text(
        `${t('Evidence snapshot')}: ${t(input.snapshot.label)} | ${date(new Date(input.snapshot.asOf))}`,
        9,
        colors.muted,
      );
      text(
        t(
          input.snapshot.kind === 'live'
            ? 'Public evidence'
            : 'Simulated evidence',
        ),
        9,
        colors.cyan,
      );
      if (input.snapshot.note) text(t(input.snapshot.note), 9, colors.muted);
      metrics();
      text(
        t(
          'RM {0} allocated · RM {1} remaining. Catalogue fees are currently free; staff time and software costs are separate.',
          {
            0: plan.allocated,
            1: Math.max(0, input.workforce.budget - plan.allocated),
          },
        ),
        9,
        colors.muted,
      );

      section('Team allocation');
      if (!plan.team.length)
        text(t('No team members are included in this plan.'), 11);
      for (const row of plan.allocations) {
        const a = `${inline(row.profile.name)}\n${inline(row.profile.currentRole)}`;
        const b = `${inline(row.role.custom ? row.role.title : t(row.role.title))}\n${t(row.reason)}`;
        const c = `${t('Planned hours')}: ${row.included ? row.plan.totalHours : 0}\nRM ${(row.included ? row.plan.totalCost : 0).toFixed(2)}`;
        const columns = [
          { text: a, x: left, w: 150 },
          { text: b, x: left + 166, w: 190 },
          { text: c, x: left + 372, w: width - 372 },
        ];
        const h =
          Math.max(...columns.map((col) => height(col.text, 9, col.w))) + 18;
        ensure(h + 6);
        columns.forEach((col) =>
          pdf
            .fontSize(9)
            .fillColor(colors.ink)
            .text(clean(col.text), col.x, y, { width: col.w, lineGap: 2 }),
        );
        y += h - 8;
        rule();
      }
      text(
        t(
          'Allocation follows the displayed worker order. It is a planning heuristic, not an optimum allocation or an employment decision.',
        ),
        9,
        colors.muted,
      );
      section('Proposed internal openings');
      text(
        plan.openings
          .map(({ role, count, worker }) => {
            return `${worker ? `${inline(worker)} · ` : ''}${inline(role.custom ? role.title : t(role.title))}: ${count}`;
          })
          .join(' | ') || t('No internal slot'),
        9,
        colors.muted,
      );

      if (!plan.groups.size) {
        section('Shared training courses');
        text(
          t('No training is allocated under the current constraints.'),
          10,
          colors.muted,
        );
      }
      let firstCourse = true;
      for (const { course, names } of plan.groups.values()) {
        const courseLines: Line[] = [
          { value: course.title, size: 12, color: colors.ink, gap: 5 },
          {
            value: `${course.provider} | ${course.hours} ${t('hours')} (${t(course.durationKind)}) | RM ${course.fee.toFixed(2)} ${t('per learner')}`,
            size: 9,
            color: colors.muted,
            gap: 5,
          },
          {
            value: `${t('Learners')}: ${names.map(inline).join(', ')}`,
            size: 9,
            color: colors.ink,
            gap: 5,
          },
          {
            value: course.url,
            size: 8,
            color: colors.cyan,
            gap: 5,
            link: course.url,
          },
          {
            value: `${t('Source checked')} ${course.checkedAt}`,
            size: 8,
            color: colors.muted,
            gap: 8,
          },
        ];
        if (firstCourse) {
          ensure(
            courseLines.reduce(
              (sum, line) => sum + height(line.value, line.size) + line.gap,
              height(t('Shared training courses'), 15) + 38,
            ),
          );
          section('Shared training courses');
          firstCourse = false;
        }
        block(courseLines, 14);
        rule();
      }

      if (y > 80) {
        pdf.addPage();
        y = 80;
      }
      section('Individual learning schedules');
      for (const row of plan.allocations) {
        const gaps = row.match.gaps
          .filter((gap) => gap.gap > 0)
          .map(
            (gap) =>
              `${t(skillById[gap.id].label)} (${gap.current}/${gap.required})`,
          );
        block(
          [
            {
              value: inline(row.profile.name),
              size: 14,
              color: colors.purple,
              gap: 5,
            },
            {
              value: `${inline(row.profile.currentRole)} -> ${inline(row.role.custom ? row.role.title : t(row.role.title))}`,
              size: 10,
              color: colors.ink,
              gap: 5,
            },
            {
              value: t(
                '{0} hours per week over {1} weeks; personal course budget RM {2}.',
                {
                  0: row.profile.hours,
                  1: row.profile.weeks,
                  2: row.profile.budget,
                },
              ),
              size: 9,
              color: colors.muted,
              gap: 5,
            },
            {
              value: `${t('Plan status')}: ${t(row.reason)}`,
              size: 9,
              color: colors.muted,
              gap: 5,
            },
            {
              value: `${t('Current skill gaps (current / target)')}: ${gaps.join(', ') || t('None')}`,
              size: 9,
              color: colors.muted,
              gap: 8,
            },
            ...(row.role.custom
              ? [
                  {
                    value: t(
                      'Your learning targets are editable planning assumptions, not official role requirements.',
                    ),
                    size: 9,
                    color: colors.muted,
                    gap: 8,
                  },
                ]
              : []),
            ...(row.specialistSkills.length
              ? [
                  {
                    value: t('Specialist skills not covered: {0}', {
                      0: row.specialistSkills.join('; '),
                    }),
                    size: 9,
                    color: colors.muted,
                    gap: 8,
                  },
                ]
              : []),
          ],
          65,
        );
        if (row.included) {
          if (!row.plan.steps.length)
            text(t('No new learning is scheduled for this person.'), 9);
          row.plan.steps.forEach((step, index) => {
            const title = `${index + 1}. ${t('Week {0}-{1}', { 0: step.startWeek, 1: step.endWeek })} | ${step.course.title}`;
            const detail = `${step.course.provider} | ${step.course.hours} ${t('hours')} | RM ${step.course.fee.toFixed(2)} | ${t('Open course')}`;
            if (y + height(title, 10) + height(detail, 8) + 13 > bottom()) {
              pdf.addPage();
              y = 80;
              text(
                `${inline(row.profile.name)} - ${t('Learning schedule (continued)')}`,
                11,
                colors.purple,
                10,
              );
            }
            block([
              { value: title, size: 10, color: colors.ink, gap: 3 },
              {
                value: detail,
                size: 8,
                color: colors.cyan,
                gap: 10,
                link: step.course.url,
              },
            ]);
          });
          if (row.plan.completed.length)
            text(
              `${t('Already studied')}: ${row.plan.completed.map((course) => course.title).join('; ')}`,
              9,
              colors.muted,
            );
          if (row.plan.uncovered.length)
            text(
              `${t('Skills still to cover')}: ${row.plan.uncovered.map((id) => t(skillById[id].label)).join(', ')}`,
              9,
              colors.muted,
            );
        } else
          text(
            t('No courses or training hours are assigned to this person.'),
            9,
            colors.muted,
          );
        rule();
      }

      ensure(280);
      section('Planning assumptions and SDG activity');
      text(
        `${t('{0} learners', { 0: plan.learners })} - SDG 4.4\n${t('{0} person-hours', { 0: plan.hours })} - SDG 8.2 / 8.5\n${t('{0} free routes', { 0: plan.learners })} - SDG 10.2`,
        10,
      );
      text(
        t(
          'These are overlapping activity counts, not official UN indicators. No jobs saved, employment outcomes or inequality reductions have been measured.',
        ),
        9,
        colors.muted,
      );
      text(
        t(
          'Course coverage is a planning assumption. Study and assessment are needed to confirm proficiency.',
        ),
        9,
        colors.muted,
      );
      text(t('Planning scenarios, not predictions.'), 9, colors.muted);
      text(
        `${t('Model')}: ${MODEL_VERSION} | ${t('Snapshot')}: ${input.snapshot.id}`,
        8,
        colors.muted,
      );

      const range = pdf.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        pdf.switchToPage(i);
        const previousBottom = pdf.page.margins.bottom;
        pdf.page.margins.bottom = 0;
        pdf
          .fontSize(10)
          .fillColor(colors.purple)
          .text('ArcTalent', left, 32, { lineBreak: false });
        pdf
          .fontSize(8)
          .fillColor(colors.muted)
          .text(t('Workforce learning plan'), left + 100, 34, {
            width: width - 100,
            align: 'right',
            lineBreak: false,
          });
        pdf
          .moveTo(left, 55)
          .lineTo(left + width, 55)
          .lineWidth(0.5)
          .strokeColor(colors.line)
          .stroke();
        pdf
          .fontSize(8)
          .fillColor(colors.muted)
          .text(t('Synthetic planning report'), left, pdf.page.height - 62, {
            lineBreak: false,
          });
        pdf.text(
          t('Page {0} of {1}', { 0: i + 1, 1: range.count }),
          left,
          pdf.page.height - 62,
          { width, align: 'right', lineBreak: false },
        );
        pdf.page.margins.bottom = previousBottom;
      }
      pdf.end();
    } catch (error) {
      doc?.destroy();
      reject(error);
    }
  });
}
