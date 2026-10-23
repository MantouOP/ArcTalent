'use client';
import { useReducer, useRef, useState } from 'react';
import { Upload, Check, ArrowRight, FileText } from 'lucide-react';
import { skills, baseProfile, employees } from '@/lib/catalogue';
import { useLanguage } from '@/lib/i18n';
import type { Profile } from '@/lib/types';
import { profileSchema } from '@/lib/validation';
import { cvEvidenceReducer, initialCvEvidence } from '@/lib/cv-evidence';
import { PreferenceCheck } from './preference-check';
export function ProfilePanel({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (p: Profile) => void;
}) {
  const { t, skillLabel, translateCurrentRole } = useLanguage();
  const [form, setForm] = useState(profile);
  const [cv, dispatchCv] = useReducer(cvEvidenceReducer, initialCvEvidence);
  const request = useRef(0);
  const { text, synthetic, message, candidates } = cv;
  const busy = cv.requestId !== null;
  const setMessage = (message: string) =>
    dispatchCv({ type: 'message', message });
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((p) => ({ ...p, [key]: value }));
  async function analyze() {
    if (!synthetic) {
      setMessage(t.profilePanel.cvMessages.confirmFirst);
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
        message: t.profilePanel.cvMessages.reviewCandidates(body.mode),
      });
    } catch (e) {
      dispatchCv({
        type: 'complete',
        requestId,
        message:
          e instanceof Error
            ? e.message
            : t.profilePanel.cvMessages.extractionUnavailable,
      });
    }
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    dispatchCv({ type: 'source' });
    if (!synthetic) {
      setMessage(t.profilePanel.cvMessages.confirmBeforeImport);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage(t.profilePanel.cvMessages.fileTooLarge);
      return;
    }
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.txt') && !filename.endsWith('.pdf')) {
      setMessage(t.profilePanel.cvMessages.invalidFileType);
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
          message: t.profilePanel.cvMessages.txtImported,
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
          message: t.profilePanel.cvMessages.pdfImported,
        });
      }
    } catch (e) {
      dispatchCv({
        type: 'complete',
        requestId,
        message:
          e instanceof Error ? e.message : t.profilePanel.cvMessages.readError,
      });
    }
  }
  return (
    <div className="profile-flow">
      <PreferenceCheck profile={form} onChange={setForm} />
      <div className="profile-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">
                {t.profilePanel.startingPointEyebrow}
              </span>
              <h2>{t.profilePanel.experienceCounts}</h2>
            </div>
            <FileText size={22} />
          </div>
          <p className="muted">{t.profilePanel.demoNote}</p>
          <label>
            {t.profilePanel.chooseSyntheticProfile}
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
                  {p.name} · {translateCurrentRole(p.currentRole)}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              {t.profilePanel.displayName}
              <input
                maxLength={60}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </label>
            <label>
              {t.profilePanel.currentRole}
              <input
                maxLength={100}
                value={form.currentRole}
                onChange={(e) => update('currentRole', e.target.value)}
              />
            </label>
          </div>
          <div className="form-row thirds">
            <label>
              {t.profilePanel.hoursPerWeek}
              <input
                type="number"
                min={0}
                max={40}
                value={form.hours}
                onChange={(e) => update('hours', Number(e.target.value))}
              />
            </label>
            <label>
              {t.profilePanel.budgetRm}
              <input
                type="number"
                min={0}
                max={100000}
                value={form.budget}
                onChange={(e) => update('budget', Number(e.target.value))}
              />
            </label>
            <label>
              {t.profilePanel.planWeeks}
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
            <legend>{t.profilePanel.whatWorkInterests}</legend>
            <div className="interest-options">
              {(
                [
                  ['data', t.profilePanel.interests.data],
                  ['people', t.profilePanel.interests.people],
                  ['operations', t.profilePanel.interests.operations],
                  ['sustainability', t.profilePanel.interests.sustainability],
                ] as const
              ).map(([id, title]) => (
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
                  {title}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="section-divider" />
          <h3>{t.profilePanel.yourCurrentSkills}</h3>
          <p className="muted small">{t.profilePanel.skillScaleNote}</p>
          <div className="skill-edit-grid">
            {skills.map((s) => (
              <label key={s.id}>
                {skillLabel(s.id)}
                <select
                  value={form.skills[s.id] ?? 0}
                  onChange={(e) =>
                    update('skills', {
                      ...form.skills,
                      [s.id]: Number(e.target.value),
                    })
                  }
                >
                  <option value={0}>{t.profilePanel.skillLevels[0]}</option>
                  <option value={1}>{t.profilePanel.skillLevels[1]}</option>
                  <option value={2}>{t.profilePanel.skillLevels[2]}</option>
                  <option value={3}>{t.profilePanel.skillLevels[3]}</option>
                </select>
              </label>
            ))}
          </div>
          <button
            className="primary full"
            onClick={() => {
              const parsed = profileSchema.safeParse(form);
              if (!parsed.success) {
                setMessage(t.profilePanel.checkLimitsError);
                return;
              }
              onSave(parsed.data);
            }}
          >
            {t.profilePanel.updatePathwaysBtn}
            <ArrowRight size={16} />
          </button>
        </section>
        <aside className="panel upload-panel">
          <span className="eyebrow">{t.profilePanel.optionalSyntheticCv}</span>
          <h2>{t.profilePanel.discoverBuildingBlocks}</h2>
          <p>{t.profilePanel.importCvDesc}</p>
          <p>
            <a className="external" href="/synthetic-cv.txt" download>
              {t.profilePanel.downloadSampleTxt}
            </a>{' '}
            ·{' '}
            <a className="external" href="/synthetic-cv.pdf" download>
              {t.profilePanel.samplePdf}
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
            {t.profilePanel.syntheticConfirmCheckbox}
          </label>
          <label className="upload-zone">
            <Upload size={28} />
            <strong>{t.profilePanel.importSyntheticCv}</strong>
            <span>{t.profilePanel.fileFormatHint}</span>
            <input
              type="file"
              accept=".pdf,.txt"
              disabled={!synthetic || busy}
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
          <textarea
            aria-label={t.profilePanel.cvTextareaAria}
            rows={8}
            maxLength={12000}
            placeholder={t.profilePanel.cvPlaceholder}
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
            {busy
              ? t.profilePanel.readingSample
              : t.profilePanel.findSkillsBtn}
            <ArrowRight size={15} />
          </button>
          <p className="status-text" role="status">
            {message}
          </p>
          {candidates.map((c) => (
            <div className="candidate" key={c.id}>
              <strong>{skillLabel(c.id)}</strong>
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
                {t.profilePanel.addAsBasicBtn}
              </button>
            </div>
          ))}
          <p className="muted small">{t.profilePanel.privacyNote}</p>
        </aside>
      </div>
    </div>
  );
}
