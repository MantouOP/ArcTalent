'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import {
  BadgeCheck,
  Check,
  Database,
  Download,
  RotateCcw,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react';
import { languageOptions, resolveLocale } from '@/lib/i18n';
import {
  sectionForKey,
  settingsSections,
  type SettingsSection,
} from '@/lib/settings-sections';
import type { Profile } from '@/lib/types';
import { LOW_BANDWIDTH_STORAGE_KEY } from '@/lib/finals-enhancements';
import { useI18n } from './language-provider';
import { useDisplayPreferences } from './display-preferences-provider';
import { ProfilePanel } from './profile-panel';
import './settings-panel.css';

const sectionDetails = {
  profile: { label: 'Profile', icon: UserRound },
  skills: { label: 'Skills', icon: BadgeCheck },
  display: { label: 'Language & accessibility', icon: SlidersHorizontal },
  data: { label: 'Demo data', icon: Database },
} as const;

export function SettingsPage({
  profile,
  profiles,
  section,
  onSectionChange,
  onSaveProfile,
  onExport,
  exporting,
  exportError,
  onReset,
}: {
  profile: Profile;
  profiles: Profile[];
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  onSaveProfile: (profile: Profile) => void;
  onExport: () => void;
  exporting: boolean;
  exportError: boolean;
  onReset: () => void;
}) {
  const { t } = useI18n();
  const id = useId();
  const tabs = useRef<Partial<Record<SettingsSection, HTMLButtonElement>>>({});
  // A demo reset replaces the saved profile, so the draft starts again from it.
  const [draftRevision, setDraftRevision] = useState(0);
  function moveFocus(event: KeyboardEvent<HTMLButtonElement>) {
    const next = sectionForKey(section, event.key);
    if (!next) return;
    event.preventDefault();
    onSectionChange(next);
    tabs.current[next]?.focus();
  }
  return (
    <div className="settings-page">
      <div
        className="settings-tabs"
        role="tablist"
        aria-label={t('Settings categories')}
      >
        {settingsSections.map((item) => {
          const { label, icon: Icon } = sectionDetails[item];
          const selected = item === section;
          return (
            <button
              key={item}
              ref={(element) => {
                if (element) tabs.current[item] = element;
              }}
              type="button"
              role="tab"
              id={`${id}-${item}-tab`}
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              className={selected ? 'selected' : ''}
              onClick={() => onSectionChange(item)}
              onKeyDown={moveFocus}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{t(label)}</span>
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${section}-tab`}
        className="settings-tabpanel"
      >
        {/* Profile and Skills edit one draft. It stays mounted on the other
            tabs so unsaved edits and CV suggestions are kept. */}
        <div hidden={section !== 'profile' && section !== 'skills'}>
          <ProfilePanel
            key={draftRevision}
            profile={profile}
            profiles={profiles}
            section={section === 'skills' ? 'skills' : 'profile'}
            onSectionChange={onSectionChange}
            onSave={onSaveProfile}
          />
        </div>
        {section === 'display' && <DisplaySettings />}
        {section === 'data' && (
          <DataSettings
            onExport={onExport}
            exporting={exporting}
            exportError={exportError}
            onReset={() => {
              onReset();
              setDraftRevision((revision) => revision + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}

function DisplaySettings() {
  const { t, locale, setLocale } = useI18n();
  const { preferences, updatePreferences, resetPreferences, storage } =
    useDisplayPreferences();
  const [message, setMessage] = useState('');
  const [lowBandwidth, setLowBandwidth] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(LOW_BANDWIDTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  function toggleLowBandwidth(enabled: boolean) {
    setLowBandwidth(enabled);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.lowBandwidth = String(enabled);
    }
    try {
      localStorage.setItem(LOW_BANDWIDTH_STORAGE_KEY, String(enabled));
    } catch {
      /* Storage is optional. */
    }
  }
  const id = useId();
  return (
    <section className="panel settings-panel" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{t('Language & accessibility')}</h2>
      <p className="settings-intro">
        {t('Make ArcTalent easier to read and work with.')}
      </p>
      <div className="settings-row">
        <div>
          <label htmlFor={`${id}-language`}>{t('Interface language')}</label>
          <p>{t('Applies to the dashboard and career guide.')}</p>
        </div>
        <select
          id={`${id}-language`}
          value={locale}
          onChange={(event) => setLocale(resolveLocale(event.target.value))}
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value} lang={option.value}>
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
              textSize: event.target.value === 'larger' ? 'larger' : 'standard',
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
      <div className="settings-row">
        <div>
          <label htmlFor={`${id}-bandwidth`}>{t('Low-bandwidth mode')}</label>
          <p id={`${id}-bandwidth-help`}>
            {t(
              'Disable decorative shadows, blurs and transitions for mobile or low-data connections.',
            )}
          </p>
        </div>
        <input
          id={`${id}-bandwidth`}
          className="settings-switch"
          type="checkbox"
          role="switch"
          checked={lowBandwidth}
          aria-describedby={`${id}-bandwidth-help`}
          onChange={(event) => toggleLowBandwidth(event.target.checked)}
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
      {message && (
        <p className="settings-message" role="status">
          {t(message)}
        </p>
      )}
    </section>
  );
}

function DataSettings({
  onExport,
  exporting,
  exportError,
  onReset,
}: {
  onExport: () => void;
  exporting: boolean;
  exportError: boolean;
  onReset: () => void;
}) {
  const { t } = useI18n();
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
    <section className="panel settings-panel" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>{t('Demo data')}</h2>
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
      {message && (
        <p className="settings-message" role="status">
          {t(message)}
        </p>
      )}
    </section>
  );
}
