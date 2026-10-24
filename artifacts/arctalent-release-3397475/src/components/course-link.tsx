'use client';

import { ArrowUpRight } from 'lucide-react';
import type { Course } from '@/lib/types';
import { useI18n } from './language-provider';
import './course-link.css';

/** Course identity and destination always come from the planner's catalogue. */
export function CourseLink({ course }: { course: Course }) {
  const { t } = useI18n();
  return (
    <a
      className="course-access"
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('Open course: {0} on {1} (opens in a new tab)', {
        0: course.title,
        1: course.provider,
      })}
    >
      <strong>
        {t('Open course')} <ArrowUpRight size={15} aria-hidden="true" />
      </strong>
      <small>{new URL(course.url).hostname.replace(/^www\./, '')}</small>
    </a>
  );
}
