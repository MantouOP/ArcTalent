'use client';

import React from 'react';
import './pathway-preview-card.css';
import { useI18n } from './language-provider';

const nextSteps = [
  'Business intelligence',
  'Project management',
  'Learning & development',
];

export default function PathwayPreviewCard() {
  const { t } = useI18n();

  return (
    <div className="pathway-preview-card relative w-full max-w-[640px] rounded-[28px] rounded-br-[64px] border border-white/80 bg-gradient-to-br from-[#F3F5F9] via-[#EFF2F9] to-[#E9ECF5] p-7 shadow-[0_20px_50px_rgba(30,41,59,0.08)]">
      {/* Top Header */}
      <div className="flex items-center justify-between text-sm font-medium text-[#534B8C]">
        <span>ArcTalent / {t('Pathway preview')}</span>
        <span>{t('Fictional example')}</span>
      </div>

      {/* Profile Header */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAE8F2] text-lg font-bold text-[#1E293B]">
            A
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#1E293B]">Aina</h3>
            <p className="text-sm text-[#475569]">
              {t('Administrative assistant')}
            </p>
          </div>
        </div>
        <div className="text-right text-sm font-medium text-[#475569]">
          <div>4 h/week</div>
          <div className="mt-0.5">RM 0</div>
        </div>
      </div>

      {/* Pathway diagram. One grid: every connector is drawn by the cell it
          joins, so the cards and their lines stay together at any width. */}
      <div className="pathway-diagram">
        <div className="pathway-source">
          <div className="text-xs font-medium text-[#526071]">
            {t('Learn first')}
          </div>
          <div className="mt-1 text-[16px] font-bold leading-snug text-[#285961]">
            {t('Shared foundation')}
          </div>
          <div className="mt-1.5 text-xs leading-relaxed text-[#526071]">
            Data literacy + Critical thinking
          </div>
        </div>

        {nextSteps.map((title, index) => (
          <React.Fragment key={title}>
            <span
              className={`pathway-link pathway-row-${index + 1}`}
              aria-hidden="true"
            />
            <div className={`pathway-target pathway-row-${index + 1}`}>
              <div>
                <div className="text-xs font-medium text-[#526071]">
                  {t('Then explore')}
                </div>
                <div className="pathway-target-title mt-0.5 text-[15px] font-bold text-[#1E293B]">
                  {title}
                </div>
              </div>
              <span className="pathway-target-dot" aria-hidden="true" />
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-4 flex items-center gap-2.5 text-sm font-medium text-[#285961]">
        <svg
          className="h-4 w-4 shrink-0 text-[#285961]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span>{t('Build a foundation. Keep your options open.')}</span>
      </div>
    </div>
  );
}
