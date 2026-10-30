'use client';
import { skills } from '@/lib/catalogue';
import type { Profile } from '@/lib/types';
import { useI18n } from './language-provider';

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
            onChange={(event) => update('hours', Number(event.target.value))}
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
            onChange={(event) => update('budget', Number(event.target.value))}
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
            onChange={(event) => update('weeks', Number(event.target.value))}
          />
        </label>
      </div>
      <fieldset>
        <legend>{t('What work interests you?')}</legend>
        <div className="interest-options">
          {(
            [
              ['data', 'Data & insights'],
              ['people', 'People & projects'],
              ['operations', 'Business operations'],
              ['sustainability', 'Sustainability'],
            ] as const
          ).map(([id, label]) => (
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
