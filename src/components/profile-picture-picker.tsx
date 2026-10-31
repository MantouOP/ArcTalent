'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { Check, LoaderCircle, RotateCcw, Upload } from 'lucide-react';
import { avatarPresets } from '@/lib/profile-pictures';
import {
  prepareProfilePhoto,
  PhotoUploadError,
} from '@/lib/prepare-profile-photo';
import type { Profile } from '@/lib/types';
import { AvatarImage, ProfileAvatar } from './profile-avatar';
import { useProfilePictures } from './profile-pictures-provider';
import { useI18n } from './language-provider';

const avatarGroups = [
  { group: 'animals', label: 'Animal friends' },
  { group: 'classic', label: 'Classic avatars' },
] as const;

export function ProfilePicturePicker({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const { pictures, setPicture, storage } = useProfilePictures();
  const picture = Object.hasOwn(pictures, profile.id)
    ? pictures[profile.id]
    : undefined;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const revision = useRef(0);
  const id = useId();
  useEffect(
    () => () => {
      revision.current++;
    },
    [],
  );
  function choose(preset: (typeof avatarPresets)[number]['id'] | null) {
    revision.current++;
    setBusy(false);
    setError('');
    setPicture(profile.id, preset ? { kind: 'preset', id: preset } : null);
  }
  async function upload(file: File) {
    const request = ++revision.current;
    setBusy(true);
    setError('');
    try {
      const dataUrl = await prepareProfilePhoto(file);
      if (request === revision.current)
        setPicture(profile.id, { kind: 'upload', dataUrl });
    } catch (error) {
      if (request !== revision.current) return;
      const code = error instanceof PhotoUploadError ? error.code : 'decode';
      setError(
        code === 'type'
          ? 'Choose a JPG, PNG or WebP image.'
          : code === 'size'
            ? 'Choose a nonempty image up to 5 MB.'
            : code === 'dimensions'
              ? 'Choose an image with no more than 24 million pixels.'
              : 'This image could not be read. Try a different JPG, PNG or WebP file.',
      );
    } finally {
      if (request === revision.current) setBusy(false);
    }
  }
  return (
    <section className="picture-picker" aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`}>{t('Profile picture')}</h3>
      <div className="picture-preview-row">
        <ProfileAvatar profile={profile} className="picture-preview" />
        <div className="picture-upload">
          <div className="picture-actions">
            <button
              type="button"
              className="settings-action"
              disabled={busy || storage === 'checking'}
              aria-busy={busy}
              onClick={() => input.current?.click()}
            >
              {busy ? (
                <LoaderCircle className="spin" size={15} />
              ) : (
                <Upload size={15} />
              )}
              {t(busy ? 'Preparing photo…' : 'Upload a photo')}
            </button>
            <button
              type="button"
              className="settings-action"
              disabled={storage === 'checking'}
              onClick={() => choose(null)}
            >
              <RotateCcw size={15} aria-hidden="true" />
              {t('Reset to Default')}
            </button>
          </div>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label={t('Choose a profile photo')}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void upload(file);
            }}
          />
          <p id={`${id}-help`}>
            {t(
              'JPG, PNG or WebP · up to 5 MB. Photos are cropped to a square and stored only in this browser.',
            )}
          </p>
        </div>
      </div>
      <fieldset
        className="picture-options"
        aria-describedby={`${id}-help`}
        disabled={storage === 'checking'}
      >
        <legend>{t('Or choose an avatar')}</legend>
        {avatarGroups.map(({ group, label }) => (
          <div
            className="picture-options-group"
            data-avatar-group={group}
            key={group}
            role="group"
            aria-labelledby={`${id}-${group}-heading`}
          >
            <h4 id={`${id}-${group}-heading`} className="picture-group-title">
              {t(label)}
            </h4>
            <div className="picture-options-grid">
              {group === 'classic' && (
                <label
                  className={`picture-option ${!picture ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`${id}-picture`}
                    checked={!picture}
                    onChange={() => choose(null)}
                  />
                  <AvatarImage name={profile.name} />
                  <span>{t('Use initials')}</span>
                  {!picture && <Check className="picture-selected" size={12} />}
                </label>
              )}
              {avatarPresets
                .filter((preset) => preset.group === group)
                .map((preset) => {
                  const selected =
                    picture?.kind === 'preset' && picture.id === preset.id;
                  return (
                    <label
                      key={preset.id}
                      className={`picture-option ${selected ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`${id}-picture`}
                        checked={selected}
                        onChange={() => choose(preset.id)}
                      />
                      <AvatarImage
                        name={profile.name}
                        picture={{ kind: 'preset', id: preset.id }}
                      />
                      <span>{t(preset.label)}</span>
                      {selected && (
                        <Check className="picture-selected" size={12} />
                      )}
                    </label>
                  );
                })}
              {group === 'classic' && picture?.kind === 'upload' && (
                <label className="picture-option selected">
                  <input type="radio" name={`${id}-picture`} checked readOnly />
                  <AvatarImage name={profile.name} picture={picture} />
                  <span>{t('Your photo')}</span>
                  <Check className="picture-selected" size={12} />
                </label>
              )}
            </div>
          </div>
        ))}
      </fieldset>
      {error && (
        <p className="picture-error" role="alert">
          {t(error)}
        </p>
      )}
      <p className="picture-storage" role="status">
        {t(
          storage === 'saved'
            ? 'Profile picture saved in this browser.'
            : storage === 'unavailable'
              ? 'Browser storage is unavailable. Your picture applies for this visit only.'
              : 'Preparing profile picture…',
        )}
      </p>
    </section>
  );
}
