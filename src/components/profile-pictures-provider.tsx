'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  profilePicturesStorageKey,
  restoreProfilePictures,
  setProfilePicture,
  type ProfilePicture,
  type ProfilePictures,
} from '@/lib/profile-pictures';

type PictureContext = {
  pictures: ProfilePictures['pictures'];
  setPicture: (profileId: string, picture: ProfilePicture | null) => void;
  storage: 'checking' | 'saved' | 'unavailable';
};
const Context = createContext<PictureContext>({
  pictures: {},
  setPicture: () => {},
  storage: 'checking',
});
export function ProfilePicturesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [saved, setSaved] = useState<ProfilePictures>(() =>
    restoreProfilePictures(),
  );
  const [ready, setReady] = useState(false);
  const [storage, setStorage] = useState<PictureContext['storage']>('checking');
  useEffect(() => {
    try {
      const raw = localStorage.getItem(profilePicturesStorageKey);
      if (raw) setSaved(restoreProfilePictures(JSON.parse(raw)));
    } catch {
      /* Invalid preferences never prevent the workspace from opening. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(profilePicturesStorageKey, JSON.stringify(saved));
      setStorage('saved');
    } catch {
      setStorage('unavailable');
    }
  }, [saved, ready]);
  const setPicture = useCallback(
    (profileId: string, picture: ProfilePicture | null) => {
      setSaved((current) => setProfilePicture(current, profileId, picture));
    },
    [],
  );
  const value = useMemo(
    () => ({ pictures: saved.pictures, setPicture, storage }),
    [saved, setPicture, storage],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useProfilePictures = () => useContext(Context);
