'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, Check, Download, RotateCcw } from 'lucide-react';
import { languageOptions, resolveLocale } from '@/lib/i18n';
import type { Profile } from '@/lib/types';
import { useI18n } from './language-provider';
import { useDisplayPreferences } from './display-preferences-provider';
import { Modal } from './ui';
import './settings-panel.css';

export function SettingsPanel({
  profile,
  onClose,
  onEditProfile,
  onExport,
  exporting,
  exportError,
  onReset,
}: {
  profile: Profile;
  onClose: () => void;
  onEditProfile: () => void;
  onExport: () => void;
  exporting: boolean;
  exportError: boolean;
  onReset: () => void;
}) {
  const { t, locale, setLocale } = useI18n();
  const { preferences, updatePreferences, resetPreferences, storage } =
    useDisplayPreferences();
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState('');
  const resetTrigger = useRef<HTMLButtonElement>(null);
  const cancelReset = useRef<HTMLButtonElement>(null);
  const resetWasOpen = useRef(false);
  useEffect(() => {
    if (confirmReset) cancelReset.current?.focus();
    else if (resetWasOpen.current) resetTrigger.current?.focus();
    resetWasOpen.current = confirmReset;
  }, [confirmReset]);
  const id = useId();
  return (
    <Modal title={t('Settings')} onClose={onClose}>
      <div className="settings-panel">
        <div className="settings-identity">
          <span className="avatar">{profile.name.slice(0, 1)}</span>
          <div>
            <strong>{profile.name}</strong>
            <p>
              {t(profile.currentRole)} · {t('Synthetic demo profile')}
            </p>
          </div>
        </div>
        <p className="settings-intro">
          {t('Make ArcTalent easier to read and work with.')}
        </p>
        <section aria-labelledby={`${id}-interface`}>
          <h3 id={`${id}-interface`}>{t('Language & accessibility')}</h3>
          <div className="settings-row">
            <div>
              <label htmlFor={`${id}-language`}>
                {t('Interface language')}
              </label>
              <p>{t('Applies to the dashboard and career guide.')}</p>
            </div>
            <select
              id={`${id}-language`}
              value={locale}
              onChange={(event) => setLocale(resolveLocale(event.target.value))}
            >
              {languageOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  lang={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="settings-row">
            <div>
              <label htmlFor={`${id}-text`}>{t('Reading text size')}</label>
              <p>{t('Enlarge descriptions, learning text and form fields.')}</p>
            </div>
            <select
              id={`${id}-text`}
              value={preferences.textSize}
              onChange={(event) =>
                updatePreferences({
                  textSize:
                    event.target.value === 'larger' ? 'larger' : 'standard',
                })
              }
            >
              <option value="standard">{t('Standard')}</option>
              <option value="larger">{t('Larger')}</option>
            </select>
          </div>
          <div className="settings-row">
            <div>
              <label htmlFor={`${id}-motion`}>{t('Reduce motion')}</label>
              <p id={`${id}-motion-help`}>
                {t(
                  'Minimise transitions and smooth scrolling. Your device preference is always respected.',
                )}
              </p>
            </div>
            <input
              id={`${id}-motion`}
              className="settings-switch"
              type="checkbox"
              role="switch"
              checked={preferences.reduceMotion}
              aria-describedby={`${id}-motion-help`}
              onChange={(event) =>
                updatePreferences({ reduceMotion: event.target.checked })
              }
            />
          </div>
          <div className="settings-save-state">
            <span role="status">
              {storage === 'saved' ? (
                <>
                  <Check size={13} />
                  {t('Display preferences saved in this browser.')}
                </>
              ) : storage === 'unavailable' ? (
                t(
                  'Browser storage is unavailable. Display preferences apply for this visit.',
                )
              ) : (
                t('Preparing display preferences…')
              )}
            </span>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                resetPreferences();
                setMessage(
                  'Display defaults restored. Your learning data is unchanged.',
                );
              }}
            >
              {t('Restore display defaults')}
            </button>
          </div>
        </section>
        <section aria-labelledby={`${id}-learning`}>
          <h3 id={`${id}-learning`}>{t('Learning preferences')}</h3>
          <div className="settings-row settings-learning-row">
            <div>
              <strong>{t('Time, budget & interests')}</strong>
              <p>
                {t('{0} h/week · RM {1} course budget · {2}-week horizon', {
                  0: profile.hours,
                  1: profile.budget,
                  2: profile.weeks,
                })}
              </p>
            </div>
            <button
              type="button"
              className="settings-action"
              onClick={onEditProfile}
            >
              {t('Edit learning preferences')}
              <ArrowUpRight size={14} />
            </button>
          </div>
        </section>
        <section aria-labelledby={`${id}-data`}>
          <h3 id={`${id}-data`}>{t('Demo data')}</h3>
          <p className="settings-data-copy">
            {t(
              'Worker and company plans use this browser’s storage. Career-guide messages stay in tab memory. No account is connected.',
            )}
          </p>
          <div className="settings-data-actions">
            <button
              type="button"
              className="settings-action"
              onClick={onExport}
              disabled={exporting}
              aria-busy={exporting}
            >
              <Download size={14} />
              {t(
                exporting
                  ? 'Preparing PDF…'
                  : 'Download current learning plan (PDF)',
              )}
            </button>
            {!confirmReset && (
              <button
                ref={resetTrigger}
                type="button"
                className="settings-reset-trigger"
                onClick={() => {
                  setConfirmReset(true);
                  setMessage('');
                }}
              >
                <RotateCcw size={14} />
                {t('Reset demo data')}
              </button>
            )}
          </div>
          {exportError && (
            <p role="alert" className="notice">
              {t('Could not download the PDF. Please try again.')}
            </p>
          )}
          {confirmReset && (
            <div
              className="settings-confirm"
              role="group"
              aria-label={t('Confirm demo reset')}
            >
              <strong>{t('Restore the starting demo?')}</strong>
              <p>
                {t(
                  'This restores Aina’s profile, moderate adoption, baseline evidence, course activity and default company planning. Language and display preferences are kept.',
                )}
              </p>
              <div>
                <button
                  ref={cancelReset}
                  type="button"
                  className="settings-action"
                  onClick={() => setConfirmReset(false)}
                >
                  {t('Cancel reset')}
                </button>
                <button
                  type="button"
                  className="settings-confirm-button"
                  onClick={() => {
                    onReset();
                    setConfirmReset(false);
                    setMessage(
                      'Demo data restored. Language and display preferences are kept.',
                    );
                  }}
                >
                  {t('Confirm reset')}
                </button>
              </div>
            </div>
          )}
        </section>
        {message && (
          <p className="settings-message" role="status">
            {t(message)}
          </p>
        )}
      </div>
    </Modal>
  );
}
