'use client';
import { useEffect, useRef, useState } from 'react';
import { FileUp, LoaderCircle } from 'lucide-react';
import type { Profile } from '@/lib/types';
import {
  removeWorkforceMember,
  type WorkforceSettings,
} from '@/lib/workforce-settings';
import { createProfileDraft } from '@/lib/custom-inputs';
import {
  extractReportTextFromFile,
  parseMemberReportSkills,
} from '@/lib/member-report-parser';
import { profileSchema } from '@/lib/validation';
import { ProfileFields } from './profile-fields';
import { Modal, Tag } from './ui';
import { useI18n } from './language-provider';

const REPORT_ACCEPT =
  '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.txt,.csv';

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
  const [uploadingByMember, setUploadingByMember] = useState<
    Record<string, boolean>
  >({});
  const [memberStatus, setMemberStatus] = useState<Record<string, string>>({});
  const [toastBanner, setToastBanner] = useState('');
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const addTrigger = useRef<HTMLButtonElement>(null);
  const focusAddAfterRemove = useRef(false);
  useEffect(() => {
    if (!remove && focusAddAfterRemove.current) {
      addTrigger.current?.focus();
      focusAddAfterRemove.current = false;
    }
  }, [remove]);

  async function handleMemberReportUpload(member: Profile, file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setMemberStatus((prev) => ({
        ...prev,
        [member.id]: t('Choose a file smaller than 5 MB.'),
      }));
      return;
    }
    setUploadingByMember((prev) => ({ ...prev, [member.id]: true }));
    try {
      const text = await extractReportTextFromFile(file);
      const parsed = parseMemberReportSkills(text, member.skills, member.name);
      const updatedMember: Profile = {
        ...member,
        skills: parsed.skills,
      };
      const nextMembers = team.map((item) =>
        item.id === member.id ? updatedMember : item,
      );
      onChange({ ...workforce, members: nextMembers });
      onProfileChange(updatedMember);
      setMemberStatus((prev) => ({ ...prev, [member.id]: parsed.summary }));
      setToastBanner(parsed.summary);
    } catch {
      setMemberStatus((prev) => ({
        ...prev,
        [member.id]: t(
          'This file could not be read. Paste the report text instead.',
        ),
      }));
    } finally {
      setUploadingByMember((prev) => ({ ...prev, [member.id]: false }));
    }
  }

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
      {toastBanner && (
        <p className="notice small" role="status" aria-live="polite">
          {toastBanner}
        </p>
      )}
      {!team.length && (
        <p className="empty-state">
          {t('Your team is empty. Add a fictional worker to begin planning.')}
        </p>
      )}
      <div className="team-member-list">
        {team.map((member) => {
          const isUploading = Boolean(uploadingByMember[member.id]);
          const rowNotice = memberStatus[member.id];
          return (
            <div className="team-member-row" key={member.id}>
              <span>
                <strong>{member.name}</strong>
                <small>{t(member.currentRole)}</small>
                {rowNotice && <Tag tone="green">{rowNotice}</Tag>}
              </span>
              <div className="button-row">
                <input
                  ref={(el) => {
                    fileInputRefs.current[member.id] = el;
                  }}
                  id={`upload-report-${member.id}`}
                  type="file"
                  accept={REPORT_ACCEPT}
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void handleMemberReportUpload(member, file);
                  }}
                />
                <button
                  type="button"
                  className="text-button"
                  disabled={isUploading}
                  aria-busy={isUploading}
                  aria-label={t('Upload report for {0}', { 0: member.name })}
                  onClick={() => fileInputRefs.current[member.id]?.click()}
                >
                  {isUploading ? (
                    <LoaderCircle size={14} className="spin" />
                  ) : (
                    <FileUp size={14} />
                  )}
                  {t(isUploading ? 'Uploading…' : 'Upload Report')}
                </button>
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
          );
        })}
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
