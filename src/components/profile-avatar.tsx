'use client';
import { useState } from 'react';
import type { ProfilePicture } from '@/lib/profile-pictures';
import { useProfilePictures } from './profile-pictures-provider';
import './profile-picture.css';

export function AvatarImage({
  name,
  picture,
  className = '',
}: {
  name: string;
  picture?: ProfilePicture;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState('');
  const source =
    picture?.kind === 'preset'
      ? `/avatars/${picture.id}.svg`
      : picture?.dataUrl;
  return (
    <span className={`avatar profile-avatar ${className}`} aria-hidden="true">
      {source && failedSource !== source ? (
        <img
          src={source}
          alt=""
          width={256}
          height={256}
          onError={() => setFailedSource(source)}
        />
      ) : (
        Array.from(name.trim())[0]?.toLocaleUpperCase() || '?'
      )}
    </span>
  );
}
export function ProfileAvatar({
  profile,
  className,
}: {
  profile: { id: string; name: string };
  className?: string;
}) {
  const { pictures } = useProfilePictures();
  return (
    <AvatarImage
      name={profile.name}
      picture={
        Object.hasOwn(pictures, profile.id) ? pictures[profile.id] : undefined
      }
      className={className}
    />
  );
}
