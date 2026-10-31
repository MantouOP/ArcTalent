'use client';

import React from 'react';
import './pathway-preview-card.css';
import { useI18n } from './language-provider';

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

      {/* Pathway Diagram Area */}
      <div className="pathway-preview-diagram-wrap">
        <div className="relative mt-6 h-[290px] w-full">
          {/* SVG Connector Lines (Rendered behind cards, stopping cleanly at card borders) */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 580 290"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Start Dot under Avatar */}
            <circle cx="24" cy="18" r="5" fill="#7DD3DF" />

            {/* Cyan Line: From Avatar down and into the left edge of "Shared foundation" */}
            <path
              d="M 24 23 L 24 125 Q 24 149 48 149 L 64 149"
              stroke="#7DD3DF"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Connected Brown/Slate Lines: All 3 branches originate from (268, 149) */}
            {/* 1. Top Branch -> Business intelligence */}
            <path
              d="M 268 149 L 284 149 Q 304 149 304 129 L 304 68 Q 304 48 324 48 L 340 48"
              stroke="#5D516C"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* 2. Middle Branch -> Project management */}
            <path
              d="M 268 149 L 340 149"
              stroke="#5D516C"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* 3. Bottom Branch -> Learning & development */}
            <path
              d="M 268 149 L 284 149 Q 304 149 304 169 L 304 230 Q 304 250 324 250 L 340 250"
              stroke="#5D516C"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Shared Junction Node on the right edge of Shared Foundation */}
            <circle
              cx="268"
              cy="149"
              r="6"
              fill="#CEE5EA"
              stroke="#5D516C"
              strokeWidth="2"
            />
          </svg>

          {/* Left Card: "Learn first / Shared foundation" (Moved left + bordered + opaque bg so no line shows through) */}
          <div className="absolute left-[64px] top-[88px] z-10 w-[204px] rounded-xl border border-[#D5D1E4] bg-[#F7F6FA] p-3.5 shadow-sm">
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

          {/* Right Branch Cards: Bordered + no line striking through the words */}
          {/* Card 1: Business intelligence */}
          <div className="absolute left-[340px] top-[14px] z-10 flex w-[235px] items-center justify-between rounded-xl border border-[#D8D4E7] bg-[#F7F6FA] px-4 py-3 shadow-sm">
            <div>
              <div className="text-xs font-medium text-[#526071]">
                {t('Then explore')}
              </div>
              <div className="mt-0.5 text-[15px] font-bold text-[#1E293B]">
                Business intelligence
              </div>
            </div>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#DCD6F0]" />
          </div>

          {/* Card 2: Project management */}
          <div className="absolute left-[340px] top-[115px] z-10 flex w-[235px] items-center justify-between rounded-xl border border-[#D8D4E7] bg-[#F7F6FA] px-4 py-3 shadow-sm">
            <div>
              <div className="text-xs font-medium text-[#526071]">
                {t('Then explore')}
              </div>
              <div className="mt-0.5 text-[15px] font-bold text-[#1E293B]">
                Project management
              </div>
            </div>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#DCD6F0]" />
          </div>

          {/* Card 3: Learning & development */}
          <div className="absolute left-[340px] top-[216px] z-10 flex w-[235px] items-center justify-between rounded-xl border border-[#D8D4E7] bg-[#F7F6FA] px-4 py-3 shadow-sm">
            <div>
              <div className="text-xs font-medium text-[#526071]">
                {t('Then explore')}
              </div>
              <div className="mt-0.5 text-[15px] font-bold text-[#1E293B]">
                Learning &amp; development
              </div>
            </div>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#DCD6F0]" />
          </div>
        </div>
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
