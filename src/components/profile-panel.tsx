'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import {
  Upload,
  Check,
  ArrowRight,
  BadgeCheck,
  FileText,
  LogIn,
  LogOut,
  UserPlus,
} from 'lucide-react';
import { skills, baseProfile, employees } from '@/lib/catalogue';
import type { Profile } from '@/lib/types';
import { profileSchema } from '@/lib/validation';
import { cvEvidenceReducer, initialCvEvidence } from '@/lib/cv-evidence';
import { PreferenceCheck } from './preference-check';
import { ProfileFields } from './profile-fields';
import { ProfileAvatar } from './profile-avatar';
import { ProfilePicturePicker } from './profile-picture-picker';
import { createProfileDraft, validateCvFile } from '@/lib/custom-inputs';
import { useI18n } from './language-provider';
import { useAuth } from './auth-provider';
import { extractAliases } from '@/lib/engine';
import { Modal } from './ui';
/** One profile draft, edited on the Profile and Skills settings tabs. */
export function ProfilePanel({
  profile,
  profiles = employees,
  section,
  onSectionChange,
  onSave,
}: {
  profile: Profile;
  profiles?: Profile[];
  section: 'profile' | 'skills';
  onSectionChange: (section: 'profile' | 'skills') => void;
  onSave: (p: Profile) => void;
}) {
  const { t, locale } = useI18n();
  const { currentUser, isLoggedIn, updateProfile, openAuthModal, logout } =
    useAuth();
  const [form, setForm] = useState(profile);
  useEffect(() => {
    setForm(profile);
  }, [profile]);
  const unsaved = JSON.stringify(form) !== JSON.stringify(profile);
  const baseOptions = [
    ...employees.map(
      (sample) =>
        profiles.find((member) => member.id === sample.id) ??
        (sample.id === profile.id ? profile : sample),
    ),
    ...profiles.filter(
      (member) => !employees.some((sample) => sample.id === member.id),
    ),
  ];
  const profileOptions = baseOptions.some((member) => member.id === profile.id)
    ? baseOptions
    : [...baseOptions, profile];
  const [cv, dispatchCv] = useReducer(cvEvidenceReducer, initialCvEvidence);
  const request = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const confirmation = useRef<HTMLInputElement>(null);
  const operation = useRef<AbortController | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [useAi, setUseAi] = useState(false);
  const [service, setService] = useState<
    'checking' | 'ai' | 'local' | 'unknown'
  >('checking');
  const [fileName, setFileName] = useState('');
  const [formError, setFormError] = useState('');
  const { text, consented, message, candidates } = cv;
  const busy = cv.requestId !== null;
  useEffect(() => {
    const controller = new AbortController();
    async function checkService() {
      try {
        const response = await fetch('/api/health', {
          cache: 'no-store',
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(6000),
          ]),
        });
        const result = await response.json();
        if (!response.ok || result.ok !== true)
          throw new Error('Status unavailable');
        if (!controller.signal.aborted)
          setService(
            result.extraction === 'runpod-configured'
              ? 'ai'
              : result.extraction === 'local-alias-matching'
                ? 'local'
                : 'unknown',
          );
      } catch {
        if (!controller.signal.aborted) setService('unknown');
      }
    }
    void checkService();
    return () => {
      controller.abort();
      operation.current?.abort();
    };
  }, []);
  function clearCv() {
    operation.current?.abort();
    setPendingFile(null);
    setUseAi(false);
    setFileName('');
    dispatchCv({ type: 'reset' });
  }
  const reviewSuffix =
    '. Review these candidates and set your own skill levels below.';
  let statusMessage = t(message);
  if (message.endsWith(reviewSuffix)) {
    const mode = message.slice(0, -reviewSuffix.length);
    const runPodMode = mode.match(
      /^RunPod extraction · (.+) · human confirmation required$/,
    );
    statusMessage = t(
      '{0}. Review these candidates and set your own skill levels below.',
      {
        0: runPodMode
          ? t('RunPod extraction · {0} · human confirmation required', {
              0: runPodMode[1],
            })
          : t(mode),
      },
    );
  }
  const setMessage = (message: string) =>
    dispatchCv({ type: 'message', message });
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((p) => ({ ...p, [key]: value }));
  async function analyze() {
    if (!consented) {
      setMessage('Agree to CV processing before finding skills.');
      confirmation.current?.focus();
      return;
    }
    if (text.trim().length < 5) {
      setMessage('Add at least 5 characters of work experience.');
      return;
    }
    operation.current?.abort();
    const controller = new AbortController();
    operation.current = controller;
    const requestId = ++request.current;
    dispatchCv({ type: 'start', requestId });
    try {
      if (!useAi) {
        dispatchCv({
          type: 'complete',
          requestId,
          candidates: extractAliases(text),
          message: `Local skill matching (on your device)${reviewSuffix}`,
        });
        return;
      }
      const r = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, processingConsent: true, useAi: true }),
        signal: controller.signal,
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      dispatchCv({
        type: 'complete',
        requestId,
        candidates: body.skills,
        message: `${body.mode}. Review these candidates and set your own skill levels below.`,
      });
    } catch (e) {
      dispatchCv({
        type: 'complete',
        requestId,
        message: e instanceof Error ? e.message : 'Extraction unavailable',
      });
    }
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    const fileError = validateCvFile(file);
    if (fileError) {
      setMessage(fileError);
      return;
    }
    // This function is called only by the explicit Agree and import action.
    operation.current?.abort();
    const controller = new AbortController();
    operation.current = controller;
    dispatchCv({ type: 'source', text: '', consented: true });
    setFileName(file.name);
    const filename = file.name.toLowerCase();
    const requestId = ++request.current;
    dispatchCv({ type: 'start', requestId });
    try {
      if (filename.endsWith('.txt')) {
        const imported = (await file.text()).trim();
        if (imported.length < 5)
          throw new Error('Add at least 5 characters of work experience.');
        dispatchCv({
          type: 'complete',
          requestId,
          text: imported.slice(0, 12000),
          message:
            imported.length > 12000
              ? 'First 12,000 characters imported. Choose Find skills to review candidates.'
              : 'Text imported. Choose Find skills to review candidates.',
        });
      } else {
        const data = new FormData();
        data.set('file', file);
        data.set('processingConsent', 'true');
        const res = await fetch('/api/pdf', {
          method: 'POST',
          body: data,
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        dispatchCv({
          type: 'complete',
          requestId,
          text: json.text,
          message:
            'PDF text imported. Choose Find skills to review candidates.',
        });
      }
    } catch (e) {
      dispatchCv({
        type: 'complete',
        requestId,
        message:
          e instanceof Error
            ? e.message
            : 'File could not be read. Paste its text instead.',
      });
    }
  }
  return (
    <div className="profile-flow" lang={locale}>
      {section === 'profile' && (
        <PreferenceCheck profile={form} onChange={setForm} />
      )}
      <div className="profile-grid">
        <form
          className="panel"
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = profileSchema.safeParse(form);
            if (!parsed.success) {
              setFormError('Check the name and numeric limits before saving.');
              // The name and limits are on the Profile tab.
              onSectionChange('profile');
              return;
            }
            setFormError('');
            updateProfile(parsed.data);
            onSave(parsed.data);
          }}
        >
          <div className="profile-account-banner">
            <div className="profile-account-banner-info">
              <strong>
                {isLoggedIn && currentUser
                  ? `${currentUser.name} (${currentUser.email})`
                  : t('Browsing with local profile')}
              </strong>
              <small>
                {isLoggedIn && currentUser
                  ? t(
                      'Signed in. Clicking Update my pathways syncs your profile, skills and custom interests to your account.',
                    )
                  : t(
                      'Log in or sign up to save your profile, custom interests and skills to a named account.',
                    )}
              </small>
            </div>
            <div className="profile-account-banner-actions">
              {isLoggedIn ? (
                <>
                  <button
                    type="button"
                    className="auth-pill-button"
                    onClick={() => openAuthModal('login')}
                  >
                    <LogIn size={14} aria-hidden="true" />
                    {t('Switch account')}
                  </button>
                  <button
                    type="button"
                    className="auth-pill-button"
                    onClick={logout}
                  >
                    <LogOut size={14} aria-hidden="true" />
                    {t('Log out')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="auth-pill-button"
                    onClick={() => openAuthModal('login')}
                  >
                    <LogIn size={14} aria-hidden="true" />
                    {t('Log in')}
                  </button>
                  <button
                    type="button"
                    className="auth-pill-button primary-pill"
                    onClick={() => openAuthModal('signup')}
                  >
                    <UserPlus size={14} aria-hidden="true" />
                    {t('Sign up')}
                  </button>
                </>
              )}
            </div>
          </div>
          {section === 'profile' ? (
            <>
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">{t('YOUR STARTING POINT')}</span>
                  <h2>{t('Experience counts.')}</h2>
                </div>
                <FileText size={22} />
              </div>
              <p className="muted">
                {t(
                  'Start with a sample or your own profile. Review every suggested skill before saving.',
                )}
              </p>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setForm(createProfileDraft(form.id));
                  setFormError('');
                  clearCv();
                }}
              >
                {t('Reset')}
              </button>
              <label>
                {t('Choose a synthetic profile')}
                <select
                  value={form.id}
                  onChange={(e) => {
                    const p =
                      profileOptions.find((x) => x.id === e.target.value) ??
                      baseProfile;
                    setForm(structuredClone(p));
                    setFormError('');
                    clearCv();
                  }}
                >
                  {!profileOptions.some((p) => p.id === form.id) && (
                    <option value={form.id}>{t('My custom profile')}</option>
                  )}
                  {profileOptions.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name} · {t(p.currentRole)}
                    </option>
                  ))}
                </select>
              </label>
              <ProfileFields profile={form} onChange={setForm} part="details" />
            </>
          ) : (
            <>
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">
                    {t('YOUR EXPERIENCE IS A HEAD START')}
                  </span>
                  <h2>{t('Your current skills')}</h2>
                </div>
                <BadgeCheck size={22} />
              </div>
              <ProfileFields profile={form} onChange={setForm} part="skills" />
            </>
          )}
          {formError && (
            <p className="status-text" role="alert">
              {t(formError)}
            </p>
          )}
          {unsaved && (
            <p className="profile-unsaved">
              {t(
                'Unsaved changes. Profile and skill edits are saved together.',
              )}
            </p>
          )}
          <button type="submit" className="primary full">
            {t('Update my pathways')}
            <ArrowRight size={16} />
          </button>
        </form>
        {section === 'profile' ? (
          <aside className="panel settings-panel">
            <div className="settings-identity">
              <ProfileAvatar profile={form} />
              <div>
                <h2>{form.name || profile.name}</h2>
                <p>
                  {form.currentRole ? `${t(form.currentRole)} · ` : ''}
                  {isLoggedIn && currentUser
                    ? currentUser.email
                    : t('Synthetic demo profile')}
                </p>
              </div>
            </div>
            <ProfilePicturePicker key={profile.id} profile={profile} />
          </aside>
        ) : (
          <aside className="panel upload-panel">
            <span className="eyebrow">{t('OPTIONAL · CV IMPORT')}</span>
            <h2>{t('Import your CV')}</h2>
            <p>
              {t(
                'Upload your CV or paste work experience. Review the text before finding skills.',
              )}
            </p>
            <p>
              <a className="external" href="/synthetic-cv.txt" download>
                {t('Download the sample TXT')}
              </a>{' '}
              ·{' '}
              <a className="external" href="/synthetic-cv.pdf" download>
                {t('Sample PDF')}
              </a>
            </p>
            <p id="cv-import-help" className="muted small">
              {t(
                'Choose a file first. Review how it is processed before agreeing to import.',
              )}
            </p>
            <button
              type="button"
              className="upload-zone full"
              disabled={busy}
              aria-describedby="cv-import-help"
              onClick={() => fileInput.current?.click()}
            >
              <Upload size={28} />
              <strong>
                {t(busy ? 'Processing your CV…' : 'Choose CV file')}
              </strong>
              <span>{t('Text PDF or TXT · up to 5 MB')}</span>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              hidden
              aria-label={t('Choose a CV file')}
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = '';
                if (!file) return;
                const error = validateCvFile(file);
                if (error) setMessage(error);
                else setPendingFile(file);
              }}
            />
            {fileName && (
              <p className="muted small">
                {t('Selected file: {0}', { 0: fileName })}
              </p>
            )}
            <textarea
              aria-label={t('CV text to review')}
              rows={8}
              maxLength={12000}
              placeholder={t(
                'Example: I prepare reports in Excel, coordinate scheduling and communicate with customers…',
              )}
              value={text}
              onChange={(e) => {
                operation.current?.abort();
                setFileName('');
                dispatchCv({ type: 'source', text: e.target.value });
              }}
            />
            <div className="cv-processing-options">
              <label className="checkbox-label">
                <input
                  ref={confirmation}
                  type="checkbox"
                  checked={consented}
                  onChange={(e) => {
                    operation.current?.abort();
                    dispatchCv({ type: 'source', consented: e.target.checked });
                    if (!e.target.checked) setUseAi(false);
                  }}
                />
                {t('I agree to process this CV to suggest skills.')}
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useAi}
                  disabled={service !== 'ai' || busy}
                  aria-describedby="cv-ai-help"
                  onChange={(e) => {
                    setUseAi(e.target.checked);
                    dispatchCv({ type: 'source' });
                  }}
                />
                {t('Use AI-assisted skill detection (RunPod)')}
              </label>
              <p id="cv-ai-help" className="muted small">
                {t(
                  service === 'ai'
                    ? 'AI is configured. Enabling it sends the reviewed CV text to RunPod. Leave it off to match skills on your device.'
                    : service === 'checking'
                      ? 'Checking AI availability. Local skill matching is available on your device.'
                      : service === 'local'
                        ? 'Local skill matching is available on your device. AI is not configured on this deployment.'
                        : 'AI status is unavailable. You can still match skills on your device.',
                )}
              </p>
            </div>
            <button
              className="secondary full"
              disabled={!consented || text.trim().length < 5 || busy}
              onClick={analyze}
            >
              {t(busy ? 'Processing your CV…' : 'Find skills in my CV')}
              <ArrowRight size={15} />
            </button>
            <p className="status-text" role="status">
              {statusMessage}
            </p>
            {candidates.map((c) => (
              <div className="candidate" key={c.id}>
                <strong>{t(skills.find((s) => s.id === c.id)?.label)}</strong>
                <p>“{c.evidence}”</p>
                <button
                  className="text-button"
                  onClick={() =>
                    update('skills', {
                      ...form.skills,
                      [c.id]: Math.max(form.skills[c.id] ?? 0, 1),
                    })
                  }
                >
                  <Check size={14} />
                  {t('Add as basic — review above')}
                </button>
              </div>
            ))}
            <p className="muted small">
              {t(
                'ArcTalent does not save your CV file or CV text. Only skills you review and save are added to your profile in this browser.',
              )}
            </p>
            {(text || fileName) && (
              <button type="button" className="text-button" onClick={clearCv}>
                {t('Clear CV text and suggestions')}
              </button>
            )}
          </aside>
        )}
      </div>
      {pendingFile && (
        <Modal
          title={t('Import this CV?')}
          onClose={() => setPendingFile(null)}
        >
          <p>
            <strong>{t('Selected file: {0}', { 0: pendingFile.name })}</strong>
          </p>
          <p>
            {t(
              pendingFile.name.toLowerCase().endsWith('.txt')
                ? 'TXT files are read on your device.'
                : 'PDF files are sent to ArcTalent to extract readable text.',
            )}
          </p>
          <p>{t('ArcTalent does not save your CV file or CV text.')}</p>
          <p>
            {t(
              'Importing does not send your CV to the AI provider. AI analysis is a separate option after you review the text.',
            )}
          </p>
          <div className="button-row">
            <button
              type="button"
              className="secondary"
              onClick={() => setPendingFile(null)}
            >
              {t('Cancel')}
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                const file = pendingFile;
                setPendingFile(null);
                void upload(file);
              }}
            >
              {t('Agree and import')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
