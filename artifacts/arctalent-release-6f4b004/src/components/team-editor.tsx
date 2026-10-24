'use client';
import { useEffect, useRef, useState } from 'react';
import type { Profile } from '@/lib/types';
import {
  removeWorkforceMember,
  type WorkforceSettings,
} from '@/lib/workforce-settings';
import { createProfileDraft } from '@/lib/custom-inputs';
import { profileSchema } from '@/lib/validation';
import { ProfileFields } from './profile-fields';
import { Modal } from './ui';
import { useI18n } from './language-provider';

export function TeamEditor({
  team,
  workforce,
  onChange,
  onProfileChange,
}: {
  team: Profile[];
  workforce: WorkforceSettings;
  onChange: (settings: WorkforceSettings) => void;
  onProfileChange: (member: Profile) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [remove, setRemove] = useState<string | null>(null);
  const addTrigger = useRef<HTMLButtonElement>(null);
  const focusAddAfterRemove = useRef(false);
  useEffect(() => {
    if (!remove && focusAddAfterRemove.current) {
      addTrigger.current?.focus();
      focusAddAfterRemove.current = false;
    }
  }, [remove]);
  return (
    <section className="panel team-editor">
      <div className="panel-heading">
        <div>
          <h2>{t('Your fictional team')}</h2>
          <p>
            {t(
              'Add or edit up to ten fictional workers. Changes update the heatmap and training plan.',
            )}
          </p>
        </div>
        <button
          ref={addTrigger}
          className="secondary"
          disabled={team.length >= 10}
          onClick={() => {
            setError('');
            setDraft(createProfileDraft('custom-' + crypto.randomUUID()));
          }}
        >
          {t('Add team member')}
        </button>
      </div>
      {!team.length && (
        <p className="empty-state">
          {t('Your team is empty. Add a fictional worker to begin planning.')}
        </p>
      )}
      <div className="team-member-list">
        {team.map((member) => (
          <div className="team-member-row" key={member.id}>
            <span>
              <strong>{member.name}</strong>
              <small>{t(member.currentRole)}</small>
            </span>
            <div className="button-row">
              <button
                className="text-button"
                aria-label={t('Edit {0}', { 0: member.name })}
                onClick={() => {
                  setError('');
                  setDraft(structuredClone(member));
                }}
              >
                {t('Edit')}
              </button>
              <button
                className="text-button"
                aria-label={t('Remove {0}', { 0: member.name })}
                onClick={() => setRemove(member.id)}
              >
                {t('Remove')}
              </button>
            </div>
          </div>
        ))}
      </div>
      {team.length >= 10 && (
        <p className="muted small">
          {t(
            'Ten-member limit reached. Edit or remove a worker before adding another.',
          )}
        </p>
      )}
      {draft && (
        <Modal
          title={t('Edit fictional worker')}
          onClose={() => setDraft(null)}
        >
          <form
            className="member-form"
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = profileSchema.safeParse(draft);
              if (!parsed.success) {
                setError('Check the name and numeric limits before saving.');
                return;
              }
              const exists = team.some(
                (member) => member.id === parsed.data.id,
              );
              if (!exists && team.length >= 10) {
                setError(
                  'Ten-member limit reached. Edit or remove a worker before adding another.',
                );
                return;
              }
              const members = exists
                ? team.map((member) =>
                    member.id === parsed.data.id ? parsed.data : member,
                  )
                : [...team, parsed.data];
              onChange({ ...workforce, members });
              onProfileChange(parsed.data);
              setDraft(null);
            }}
          >
            <p className="muted">
              {t(
                'Use fictional information. Skill levels are self-reported and can be reviewed.',
              )}
            </p>
            <ProfileFields profile={draft} onChange={setDraft} />
            {error && (
              <p role="alert" className="status-text">
                {t(error)}
              </p>
            )}
            <div className="button-row">
              <button
                type="button"
                className="secondary"
                onClick={() => setDraft(null)}
              >
                {t('Cancel')}
              </button>
              <button className="primary" type="submit">
                {t('Save team member')}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal title={t('Remove team member?')} onClose={() => setRemove(null)}>
          <p>
            {t(
              'This removes the fictional worker from this company plan. The individual profile is kept.',
            )}
          </p>
          <div className="button-row">
            <button
              className="secondary"
              autoFocus
              onClick={() => setRemove(null)}
            >
              {t('Cancel')}
            </button>
            <button
              className="primary"
              onClick={() => {
                onChange(removeWorkforceMember(workforce, remove, team));
                focusAddAfterRemove.current = true;
                setRemove(null);
              }}
            >
              {t('Remove')}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
