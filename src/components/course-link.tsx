'use client';

import { ArrowUpRight, CirclePlay, Play } from 'lucide-react';
import type { Course } from '@/lib/types';
import { useI18n } from './language-provider';
import './course-link.css';

/** YouTube's own cover image for a video, from its image host. */
const cover = (id: string, size: 'mqdefault' | 'hqdefault') =>
  `https://i.ytimg.com/vi/${id}/${size}.jpg`;

/** Course identity and destination always come from the planner's catalogue. */
export function CourseLink({ course }: { course: Course }) {
  const { t } = useI18n();
  const { video } = course;
  return (
    <span className="course-links">
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
      {video && (
        <a
          className="course-video"
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          title={video.title}
          aria-label={t(
            'Watch companion video: {0} by {1} on YouTube (opens in a new tab)',
            { 0: video.title, 1: video.channel },
          )}
        >
          <span className="video-cover">
            {/* Decorative: the link's label already names the video. */}
            <img
              src={cover(video.id, 'mqdefault')}
              srcSet={`${cover(video.id, 'mqdefault')} 320w, ${cover(video.id, 'hqdefault')} 480w`}
              sizes="124px"
              width={320}
              height={180}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <span className="video-play">
              <Play size={13} fill="currentColor" aria-hidden="true" />
            </span>
            <span className="video-duration">{video.duration}</span>
          </span>
          <span className="video-meta">
            <strong>{video.title}</strong>
            <small>{video.channel}</small>
            <span className="video-source">
              <CirclePlay size={13} aria-hidden="true" />{' '}
              {t('Watch on YouTube')}
            </span>
          </span>
        </a>
      )}
    </span>
  );
}
