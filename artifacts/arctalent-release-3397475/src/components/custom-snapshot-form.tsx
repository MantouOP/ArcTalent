'use client';
import { useState } from 'react';
import { skills } from '@/lib/catalogue';
import { buildCustomSnapshot } from '@/lib/custom-inputs';
import type { Snapshot } from '@/lib/types';
import { useI18n } from './language-provider';

export function CustomSnapshotForm({
  snapshot,
  onApply,
}: {
  snapshot: Snapshot;
  onApply: (snapshot: Snapshot) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [date, setDate] = useState(
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }),
  );
  const [note, setNote] = useState('');
  const [demand, setDemand] = useState(() =>
    Object.fromEntries(
      skills.map((skill) => [
        skill.id,
        Math.round((snapshot.market[skill.id] ?? 0.5) * 100),
      ]),
    ),
  );
  const [message, setMessage] = useState('');
  return (
    <section className="panel custom-snapshot">
      <div className="panel-heading">
        <div>
          <h2>{t('Try your own dated assumptions')}</h2>
          <p>
            {t(
              'Enter a planning case and skill-demand values. These are your assumptions, not verified market data.',
            )}
          </p>
        </div>
        <button
          className="secondary"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {t(open ? 'Close custom snapshot' : 'Create custom snapshot')}
        </button>
      </div>
      {open && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            try {
              const next = buildCustomSnapshot(
                { label, date, note, demand },
                'custom-' + crypto.randomUUID(),
                new Date().toISOString(),
              );
              onApply(next);
              setMessage(
                'Custom assumptions applied. Individual and team plans recalculated.',
              );
            } catch {
              setMessage(
                'Check the label, calendar date and demand values from 0 to 100.',
              );
            }
          }}
        >
          <div className="form-row">
            <label>
              {t('Snapshot label')}
              <input
                required
                maxLength={120}
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
            <label>
              {t('Snapshot date (MYT)')}
              <input
                required
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
          </div>
          <label>
            {t('Why these assumptions?')}
            <textarea
              rows={3}
              maxLength={1500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <fieldset>
            <legend>{t('Skill demand assumptions (0–100)')}</legend>
            <p className="muted small">
              {t(
                '0 means weakest demand, 100 strongest. Other scoring weights stay the same.',
              )}
            </p>
            <div className="skill-edit-grid">
              {skills.map((skill) => (
                <label key={skill.id}>
                  {t(skill.label)}
                  <input
                    required
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={demand[skill.id]}
                    onChange={(event) =>
                      setDemand({
                        ...demand,
                        [skill.id]: Number(event.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <button className="primary" type="submit">
            {t('Apply my assumptions')}
          </button>
          <p className="status-text" role="status">
            {t(message)}
          </p>
        </form>
      )}
    </section>
  );
}
