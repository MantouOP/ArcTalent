'use client';
import { useState } from 'react';
import { Award, BookOpenCheck, ShieldCheck, TrendingUp } from 'lucide-react';
import { skillById } from '@/lib/catalogue';
import {
  summarizeTrackRecord,
  trackRecordCourse,
  type TrackRecordEntry,
} from '@/lib/track-record';
import type { Role } from '@/lib/types';
import { useI18n } from './language-provider';
import { Tag } from './ui';

const visibleByDefault = 5;

/** A learner's verifiable reskilling history: newest first, five at a time. */
export function TrackRecordPanel({
  record,
  role,
}: {
  record: readonly TrackRecordEntry[];
  role: Pick<Role, 'requirements'>;
}) {
  const { t, locale } = useI18n();
  const [showAll, setShowAll] = useState(false);
  const summary = summarizeTrackRecord(record, role);
  const shown = showAll ? record : record.slice(0, visibleByDefault);
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  const describe = (entry: TrackRecordEntry) => {
    if (entry.kind === 'course') {
      const course = trackRecordCourse(entry.courseId);
      return {
        icon: <BookOpenCheck size={16} />,
        title: t('Course completed: {0}', { 0: course?.title ?? '' }),
        detail: t('{0} · {1} hours studied', {
          0: course?.provider ?? '',
          1: course?.hours ?? 0,
        }),
      };
    }
    if (entry.kind === 'milestone-badge')
      return {
        icon: <Award size={16} />,
        title: t('Badge unlocked: {0}', { 0: t(entry.title) }),
        detail: t('Milestone badge'),
      };
    if (entry.kind === 'practice-badge')
      return {
        icon: <ShieldCheck size={16} />,
        title: t('Practice badge verified: {0}', { 0: entry.title }),
        detail: t('{0} · Evidence: “{1}”', {
          0: t(skillById[entry.skillId].label),
          1: entry.quote,
        }),
      };
    return {
      icon: <TrendingUp size={16} />,
      title: t('{0}: Level {1} → Level {2}', {
        0: t(skillById[entry.skillId].label),
        1: entry.fromLevel,
        2: entry.toLevel,
      }),
      detail:
        entry.source === 'practice-badge'
          ? t('Confirmed by you from a practice badge')
          : t('Confirmed by you in a profile review'),
    };
  };
  return (
    <div className="track-record">
      <dl className="track-record-summary">
        <div>
          <dt>{t('Total hours studied')}</dt>
          <dd>{summary.hoursStudied}</dd>
        </div>
        <div>
          <dt>{t('Verified badges')}</dt>
          <dd>{summary.verifiedBadges}</dd>
        </div>
        <div>
          <dt>{t('Skills levelled up')}</dt>
          <dd>{summary.skillsLeveledUp}</dd>
        </div>
        <div>
          <dt>{t('Gap distance closed')}</dt>
          <dd>{t('{0} levels', { 0: summary.gapDistanceClosed })}</dd>
        </div>
      </dl>
      {record.length === 0 ? (
        <p className="muted small">
          {t(
            'Your track record starts when you mark a course studied, unlock a badge or confirm a higher skill level.',
          )}
        </p>
      ) : (
        <ol className="track-record-list">
          {shown.map((entry, index) => {
            const { icon, title, detail } = describe(entry);
            return (
              <li key={`${entry.kind}-${entry.recordedAt}-${index}`}>
                <span className="track-record-icon" aria-hidden="true">
                  {icon}
                </span>
                <div>
                  <strong>{title}</strong>
                  <small className="muted">{detail}</small>
                </div>
                <time dateTime={entry.recordedAt}>
                  {date(entry.recordedAt)}
                </time>
              </li>
            );
          })}
        </ol>
      )}
      {record.length > visibleByDefault && (
        <button
          type="button"
          className="text-button"
          aria-expanded={showAll}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll
            ? t('Show latest {0}', { 0: visibleByDefault })
            : t('Show full track record ({0})', { 0: record.length })}
        </button>
      )}
      <p className="muted small">
        {t(
          'Courses and badges stay listed while they are still true. Skill levels change only when you confirm them.',
        )}{' '}
        <Tag tone="blue">{t('Saved in this browser')}</Tag>
      </p>
    </div>
  );
}
