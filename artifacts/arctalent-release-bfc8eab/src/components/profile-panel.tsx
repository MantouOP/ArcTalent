'use client';
import { useReducer, useRef, useState } from 'react';
import { Upload, Check, ArrowRight, FileText } from 'lucide-react';
import { skills, baseProfile, employees } from '@/lib/catalogue';
import type { Profile } from '@/lib/types';
import { profileSchema } from '@/lib/validation';
import { cvEvidenceReducer, initialCvEvidence } from '@/lib/cv-evidence';
import { PreferenceCheck } from './preference-check';
import { useI18n } from './language-provider';
export function ProfilePanel({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (p: Profile) => void;
}) {
  const { t, locale } = useI18n();
  const [form, setForm] = useState(profile);
  const [cv, dispatchCv] = useReducer(cvEvidenceReducer, initialCvEvidence);
  const request = useRef(0);
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
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Choose a file smaller than 5 MB.');
      return;
    }
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.txt') && !filename.endsWith('.pdf')) {
      setMessage('Use a text PDF or .txt file.');
      return;
    }
    const requestId = ++request.current;
    dispatchCv({ type: 'start', requestId });
    try {
      if (filename.endsWith('.txt')) {
        dispatchCv({
          type: 'complete',
          requestId,
          text: (await file.text()).slice(0, 12000),
          message: 'Text imported. Choose Find skills to review candidates.',
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
        <section className="panel">
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
          <label>
            {t('Choose a synthetic profile')}
            <select
              value={form.id}
              onChange={(e) => {
                const p =
                  employees.find((x) => x.id === e.target.value) ?? baseProfile;
                setForm({ ...p, skills: { ...p.skills }, completed: [] });
                dispatchCv({ type: 'reset' });
              }}
            >
              {employees.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name} · {t(p.currentRole)}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              {t('Display name')}
              <input
                maxLength={60}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </label>
            <label>
              {t('Current role')}
              <input
                maxLength={100}
                value={form.currentRole}
                onChange={(e) => update('currentRole', e.target.value)}
              />
            </label>
          </div>
          <div className="form-row thirds">
            <label>
              {t('Hours / week')}
              <input
                type="number"
                min={0}
                max={40}
                value={form.hours}
                onChange={(e) => update('hours', Number(e.target.value))}
              />
            </label>
            <label>
              {t('Budget (RM)')}
              <input
                type="number"
                min={0}
                max={100000}
                value={form.budget}
                onChange={(e) => update('budget', Number(e.target.value))}
              />
            </label>
            <label>
              {t('Plan (weeks)')}
              <input
                type="number"
                min={1}
                max={52}
                value={form.weeks}
                onChange={(e) => update('weeks', Number(e.target.value))}
              />
            </label>
          </div>
          <fieldset>
            <legend>{t('What work interests you?')}</legend>
            <div className="interest-options">
              {[
                ['data', 'Data & insights'],
                ['people', 'People & projects'],
                ['operations', 'Business operations'],
                ['sustainability', 'Sustainability'],
              ].map(([id, title]) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={form.interests.includes(id)}
                    onChange={(e) =>
                      update(
                        'interests',
                        e.target.checked
                          ? [...form.interests, id]
                          : form.interests.filter((x) => x !== id),
                      )
                    }
                  />
                  {t(title)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="section-divider" />
          <h3>{t('Your current skills')}</h3>
          <p className="muted small">
            {t(
              '0 Not yet · 1 Basic · 2 Independent · 3 Advanced. Self-reported levels, not certifications.',
            )}
          </p>
          <div className="skill-edit-grid">
            {skills.map((s) => (
              <label key={s.id}>
                {t(s.label)}
                <select
                  value={form.skills[s.id] ?? 0}
                  onChange={(e) =>
                    update('skills', {
                      ...form.skills,
                      [s.id]: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>{t('0 · Not yet')}</option>
                  <option value={1}>{t('1 · Basic')}</option>
                  <option value={2}>{t('2 · Independent')}</option>
                  <option value={3}>{t('3 · Advanced')}</option>
                </select>
              </label>
            ))}
          </div>
          <button
            className="primary full"
            onClick={() => {
              const parsed = profileSchema.safeParse(form);
              if (!parsed.success) {
                setMessage('Check the name and numeric limits before saving.');
                return;
              }
              onSave(parsed.data);
            }}
          >
            {t('Update my pathways')}
            <ArrowRight size={16} />
          </button>
        </section>
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
              type="checkbox"
              checked={synthetic}
              onChange={(e) =>
                dispatchCv({ type: 'source', synthetic: e.target.checked })
              }
            />
            {t('This is synthetic data, with no real personal information.')}
          </label>
          <label className="upload-zone">
            <Upload size={28} />
            <strong>{t('Import a synthetic CV')}</strong>
            <span>{t('Text PDF or TXT · up to 5 MB')}</span>
            <input
              type="file"
              accept=".pdf,.txt"
              disabled={!synthetic || busy}
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
          <textarea
            aria-label={t('Synthetic CV text')}
            rows={8}
            maxLength={12000}
            placeholder={t(
              'Example: I prepare reports in Excel, coordinate scheduling and communicate with customers…',
            )}
            value={text}
            onChange={(e) =>
              dispatchCv({ type: 'source', text: e.target.value })
            }
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
