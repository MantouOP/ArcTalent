export const avatarPresets = [
  { id: 'violet', label: 'Violet avatar', group: 'classic' },
  { id: 'teal', label: 'Teal avatar', group: 'classic' },
  { id: 'coral', label: 'Coral avatar', group: 'classic' },
  { id: 'blue', label: 'Blue avatar', group: 'classic' },
  { id: 'amber', label: 'Amber avatar', group: 'classic' },
  { id: 'rose', label: 'Rose avatar', group: 'classic' },
  { id: 'cat', label: 'Cat avatar', group: 'animals' },
  { id: 'puppy', label: 'Puppy avatar', group: 'animals' },
  { id: 'bunny', label: 'Bunny avatar', group: 'animals' },
  { id: 'fox', label: 'Fox avatar', group: 'animals' },
  { id: 'panda', label: 'Panda avatar', group: 'animals' },
  { id: 'bear', label: 'Bear avatar', group: 'animals' },
  { id: 'koala', label: 'Koala avatar', group: 'animals' },
  { id: 'otter', label: 'Otter avatar', group: 'animals' },
  { id: 'capybara', label: 'Capybara avatar', group: 'animals' },
  { id: 'penguin', label: 'Penguin avatar', group: 'animals' },
  { id: 'owl', label: 'Owl avatar', group: 'animals' },
  { id: 'axolotl', label: 'Axolotl avatar', group: 'animals' },
] as const;
export type AvatarPresetId = (typeof avatarPresets)[number]['id'];
export type ProfilePicture =
  { kind: 'preset'; id: AvatarPresetId } | { kind: 'upload'; dataUrl: string };
export type ProfilePictures = {
  version: 1;
  pictures: Record<string, ProfilePicture>;
};
export const profilePicturesStorageKey = 'arctalent-pictures-v1';
export const maxPhotoBytes = 5 * 1024 * 1024;
export const maxStoredPhotoLength = 128000;
export const maxPictureProfiles = 16;

function readPicture(value: unknown): ProfilePicture | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const picture = value as Record<string, unknown>;
  if (
    picture.kind === 'preset' &&
    avatarPresets.some((option) => option.id === picture.id)
  )
    return { kind: 'preset', id: picture.id as AvatarPresetId };
  if (
    picture.kind === 'upload' &&
    typeof picture.dataUrl === 'string' &&
    picture.dataUrl.length <= maxStoredPhotoLength &&
    /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      picture.dataUrl,
    )
  )
    return { kind: 'upload', dataUrl: picture.dataUrl };
  return null;
}
export function restoreProfilePictures(raw?: unknown): ProfilePictures {
  const empty: ProfilePictures = { version: 1, pictures: {} };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return empty;
  const saved = raw as Record<string, unknown>;
  if (
    saved.version !== 1 ||
    !saved.pictures ||
    typeof saved.pictures !== 'object' ||
    Array.isArray(saved.pictures)
  )
    return empty;
  const valid = Object.entries(saved.pictures)
    .flatMap(([id, value]) => {
      const picture = readPicture(value);
      return id.length <= 60 && picture ? [[id, picture] as const] : [];
    })
    .slice(-maxPictureProfiles);
  return { version: 1, pictures: Object.fromEntries(valid) };
}
export function setProfilePicture(
  current: ProfilePictures,
  profileId: string,
  value: ProfilePicture | null,
): ProfilePictures {
  if (profileId.length > 60) return current;
  const picture = value === null ? null : readPicture(value);
  if (value !== null && !picture) return current;
  const pictures = { ...current.pictures };
  delete pictures[profileId];
  if (picture)
    Object.defineProperty(pictures, profileId, {
      value: picture,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  return restoreProfilePictures({ version: 1, pictures });
}
export function validatePhotoFile(
  file: Pick<File, 'size' | 'type'>,
): 'type' | 'size' | null {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return 'type';
  return file.size > 0 && file.size <= maxPhotoBytes ? null : 'size';
}
