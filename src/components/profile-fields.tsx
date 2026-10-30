'use client';
import { useId, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { skills } from '@/lib/catalogue';
import {
  interestAreas,
  matchInterestAreas,
  maxCustomInterestLength,
  maxCustomInterests,
} from '@/lib/interests';
import type { Profile } from '@/lib/types';
import { useI18n } from './language-provider';

/** Interests in the person's own words, each shown with the work area it counts as. */
function CustomInterests({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const { t } = useI18n();
  const id = useId();
  const [draft, setDraft] = useState('');
  const full = values.length >= maxCustomInterests;
  const add = () => {
    const value = draft.trim().replace(/\s+/g, ' ');
    if (!value || full) return;
    if (!values.some((item) => item.toLowerCase() === value.toLowerCase()))
      onChange([...values, value]);
    setDraft('');
  };
  return (
    <div className="custom-interests">
      <label htmlFor={id}>{t('Add your own interest')}</label>
      <div className="custom-interest-entry">
        <input
          id={id}
          value={draft}
          maxLength={maxCustomInterestLength}
          disabled={full}
          placeholder={t('For example: graphic design, healthcare')}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter adds the interest instead of submitting the whole form.
            if (event.key !== 'Enter') return;
            event.preventDefault();
            add();
          }}
        />
        <button
          type="button"
          className="secondary"
          onClick={add}
          disabled={full || !draft.trim()}
        >
          <Plus size={15} aria-hidden="true" />
          {t('Add')}
        </button>
      </div>
      {values.length > 0 && (
        <ul className="custom-interest-list">
          {values.map((value) => {
            const areas = matchInterestAreas(value);
            return (
              <li key={value}>
                <span>
                  {value}
                  <small>
                    {areas.length
                      ? t('Counts as {0}', {
                          0: interestAreas
                            .filter((area) => areas.includes(area.id))
                            .map((area) => t(area.label))
                            .join(' · '),
                        })
                      : t('Not linked to a scored work area')}
                  </small>
                </span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t('Remove {0}', { 0: value })}
                  onClick={() =>
                    onChange(values.filter((item) => item !== value))
                  }
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="muted small">
        {full
          ? t('You can add up to {0} interests.', { 0: maxCustomInterests })
          : t(
              'Type any interest in your own words. If it matches a work area above, it counts towards your route scores. Every interest you add also appears as a goal idea under “Type your own career goal”.',
            )}
      </p>
    </div>
  );
}

export function ProfileFields({
  profile,
  onChange,
  part = 'all',
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
  /** Settings edits details and skills on separate tabs. */
  part?: 'all' | 'details' | 'skills';
}) {
  const { t } = useI18n();
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    onChange({ ...profile, [key]: value });
  const details = (
    <>
      <div className="form-row">
        <label>
          {t('Display name')}
          <input
            required
            maxLength={60}
            value={profile.name}
            onChange={(event) => update('name', event.target.value)}
          />
        </label>
        <label>
          {t('Current role')}
          <input
            maxLength={100}
            value={profile.currentRole}
            onChange={(event) => update('currentRole', event.target.value)}
          />
        </label>
      </div>
      <div className="form-row thirds">
        <label>
          {t('Hours / week')}
          <input
            required
            type="number"
            min={0}
            max={40}
            step={1}
            value={profile.hours}
            onChange={(event) => {
              const next = event.target.valueAsNumber;
              update('hours', Number.isFinite(next) ? next : 0);
            }}
          />
        </label>
        <label>
          {t('Budget (RM)')}
          <input
            required
            type="number"
            min={0}
            max={100000}
            step="any"
            value={profile.budget}
            onChange={(event) => {
              const next = event.target.valueAsNumber;
              update('budget', Number.isFinite(next) ? next : 0);
            }}
          />
        </label>
        <label>
          {t('Plan (weeks)')}
          <input
            required
            type="number"
            min={1}
            max={52}
            step={1}
            value={profile.weeks}
            onChange={(event) => {
              const next = event.target.valueAsNumber;
              update('weeks', Number.isFinite(next) ? Math.max(1, next) : 1);
            }}
          />
        </label>
      </div>
      <fieldset>
        <legend>{t('What work interests you?')}</legend>
        <div className="interest-options">
          {interestAreas.map(({ id, label }) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={profile.interests.includes(id)}
                onChange={(event) =>
                  update(
                    'interests',
                    event.target.checked
                      ? [...profile.interests, id]
                      : profile.interests.filter((value) => value !== id),
                  )
                }
              />
              {t(label)}
            </label>
          ))}
        </div>
        <CustomInterests
          values={profile.customInterests ?? []}
          onChange={(values) => update('customInterests', values)}
        />
      </fieldset>
    </>
  );
  const skillLevels = (
    <>
      <p className="muted small">
        {t(
          '0 Not yet · 1 Basic · 2 Independent · 3 Advanced. Self-reported levels, not certifications.',
        )}
      </p>
      <div className="skill-edit-grid">
        {skills.map((skill) => (
          <label key={skill.id}>
            {t(skill.label)}
            <select
              value={profile.skills[skill.id] ?? 0}
              onChange={(event) =>
                update('skills', {
                  ...profile.skills,
                  [skill.id]: Number(event.target.value),
                })
              }
            >
              {[
                '0 · Not yet',
                '1 · Basic',
                '2 · Independent',
                '3 · Advanced',
              ].map((label, level) => (
                <option value={level} key={level}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </>
  );
  if (part === 'details') return details;
  if (part === 'skills') return skillLevels;
  return (
    <>
      {details}
      <div className="section-divider" />
      <h3>{t('Your current skills')}</h3>
      {skillLevels}
    </>
  );
}
