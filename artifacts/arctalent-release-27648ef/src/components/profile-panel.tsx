'use client';
import { useReducer, useRef, useState } from 'react';
import { Upload, Check, ArrowRight, FileText } from 'lucide-react';
import { skills, baseProfile, employees } from '@/lib/catalogue';
import type { Profile } from '@/lib/types';
import { profileSchema } from '@/lib/validation';
import { cvEvidenceReducer, initialCvEvidence } from '@/lib/cv-evidence';
import { PreferenceCheck } from './preference-check';
import { ProfileFields } from './profile-fields';
import { createProfileDraft, validateCvFile } from '@/lib/custom-inputs';
import { useI18n } from './language-provider';
export function ProfilePanel({
  profile,
  profiles = employees,
  onSave,
}: {
  profile: Profile;
  profiles?: Profile[];
  onSave: (p: Profile) => void;
}) {
  const { t, locale } = useI18n();
  const [form, setForm] = useState(profile);
  const profileOptions = [
    ...employees.map(
      (sample) => profiles.find((member) => member.id === sample.id) ?? sample,
    ),
    ...profiles.filter(
      (member) => !employees.some((sample) => sample.id === member.id),
    ),
  ];
  const [cv, dispatchCv] = useReducer(cvEvidenceReducer, initialCvEvidence);
  const request = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const confirmation = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [formError, setFormError] = useState('');
  const { text, synthetic, message, candidates } = cv;
  const busy = cv.requestId !== null;
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
    if (!synthetic) {
      setMessage('Confirm that the CV is synthetic first.');
      return;
    }
    const requestId = ++request.current;
    dispatchCv({ type: 'start', requestId });
    try {
      const r = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, synthetic: true }),
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
    dispatchCv({ type: 'source' });
    if (!synthetic) {
      setMessage('Confirm synthetic data before importing a file.');
      return;
    }
    const fileError = validateCvFile(file);
    if (fileError) {
      setMessage(fileError);
      return;
    }
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
        data.set('synthetic', 'true');
        const res = await fetch('/api/pdf', { method: 'POST', body: data });
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
      <PreferenceCheck profile={form} onChange={setForm} />
      <div className="profile-grid">
        <form
          className="panel"
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = profileSchema.safeParse(form);
            if (!parsed.success) {
              setFormError('Check the name and numeric limits before saving.');
              return;
            }
            setFormError('');
            onSave(parsed.data);
          }}
        >
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{t('YOUR STARTING POINT')}</span>
              <h2>{t('Experience counts.')}</h2>
            </div>
            <FileText size={22} />
          </div>
          <p className="muted">
            {t(
              'Use a fictional profile for this hackathon demo. Confirm every inferred skill.',
            )}
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setForm(createProfileDraft('custom-' + crypto.randomUUID()));
              setFormError('');
              setFileName('');
              dispatchCv({ type: 'reset' });
            }}
          >
            {t('Start a blank profile')}
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
                setFileName('');
                setFormError('');
                dispatchCv({ type: 'reset' });
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
          <ProfileFields profile={form} onChange={setForm} />
          {formError && (
            <p className="status-text" role="alert">
              {t(formError)}
            </p>
          )}
          <button type="submit" className="primary full">
            {t('Update my pathways')}
            <ArrowRight size={16} />
          </button>
        </form>
        <aside className="panel upload-panel">
          <span className="eyebrow">{t('OPTIONAL · SYNTHETIC CV')}</span>
          <h2>{t('Discover your building blocks.')}</h2>
          <p>
            {t(
              'Import a fictional CV or paste a short description of work experience.',
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
          <label className="checkbox-label">
            <input
              ref={confirmation}
              type="checkbox"
              checked={synthetic}
              onChange={(e) =>
                dispatchCv({ type: 'source', synthetic: e.target.checked })
              }
            />
            {t('This is synthetic data, with no real personal information.')}
          </label>
          <p id="cv-import-help" className="muted small">
            {t(
              synthetic
                ? 'Choose a PDF or TXT, then review its text and find skills.'
                : 'First confirm synthetic data above to enable file import.',
            )}
          </p>
          <button
            type="button"
            className="upload-zone full"
            disabled={busy}
            aria-describedby="cv-import-help"
            onClick={() => {
              if (!synthetic) {
                setMessage('Confirm synthetic data before importing a file.');
                confirmation.current?.focus();
                return;
              }
              fileInput.current?.click();
            }}
          >
            <Upload size={28} />
            <strong>
              {t(busy ? 'Reading your sample…' : 'Import a synthetic CV')}
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
              void upload(file);
            }}
          />
          {fileName && (
            <p className="muted small">
              {t('Selected file: {0}', { 0: fileName })}
            </p>
          )}
          <textarea
            aria-label={t('Synthetic CV text')}
            rows={8}
            maxLength={12000}
            placeholder={t(
              'Example: I prepare reports in Excel, coordinate scheduling and communicate with customers…',
            )}
            value={text}
            onChange={(e) => {
              setFileName('');
              dispatchCv({ type: 'source', text: e.target.value });
            }}
          />
          <button
            className="secondary full"
            disabled={!synthetic || !text.trim() || busy}
            onClick={analyze}
          >
            {t(busy ? 'Reading your sample…' : 'Find skills in this sample')}
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
              'Skill detection uses local word matching unless a RunPod model is configured. AI suggestions always need your confirmation. CV text is processed without being saved on the server.',
            )}
          </p>
        </aside>
      </div>
    </div>
  );
}
