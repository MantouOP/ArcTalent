'use client';

import './auth-modal.css';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, LogIn, Sparkles, UserPlus, X } from 'lucide-react';
import { baseProfile, employees } from '@/lib/catalogue';
import { createProfileDraft } from '@/lib/custom-inputs';
import { profileSchema } from '@/lib/validation';
import type { Profile } from '@/lib/types';
import { useI18n } from './language-provider';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  currentRole: string;
  profile: Profile;
  createdAt: string;
};

export type SignupFormData = {
  name: string;
  email: string;
  password: string;
  currentRole?: string;
  hours?: number;
  budget?: number;
  weeks?: number;
  interest?: 'data' | 'people' | 'operations' | 'sustainability';
};

type AuthActionResult = {
  ok: boolean;
  error?: string;
  user?: AuthUser;
};

type AuthContextValue = {
  currentUser: AuthUser | null;
  isLoggedIn: boolean;
  users: AuthUser[];
  login: (email: string, password: string) => AuthActionResult;
  signup: (formData: SignupFormData) => AuthActionResult;
  logout: () => void;
  updateProfile: (newData: Partial<Profile> | Profile) => void;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
};

export const AUTH_USERS_STORAGE_KEY = 'arctalent-auth-users-v1';
export const AUTH_SESSION_STORAGE_KEY = 'arctalent-auth-session-v1';
const WORKSPACE_STORAGE_KEY = 'arctalent-v1';

function createDefaultUsers(): AuthUser[] {
  const farid = employees.find((e) => e.id === 'farid') ?? baseProfile;
  return [
    {
      id: baseProfile.id,
      name: baseProfile.name,
      email: 'aina@arctalent.my',
      password: 'demo1234',
      currentRole: baseProfile.currentRole,
      profile: structuredClone(baseProfile),
      createdAt: '2026-10-24T00:00:00.000Z',
    },
    {
      id: farid.id,
      name: farid.name,
      email: 'farid@arctalent.my',
      password: 'demo1234',
      currentRole: farid.currentRole,
      profile: structuredClone(farid),
      createdAt: '2026-10-24T00:00:00.000Z',
    },
  ];
}

function syncWorkspaceStorageProfile(nextProfile: Profile) {
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        ...existing,
        profile: nextProfile,
      }),
    );
  } catch {
    /* Browser storage is optional. */
  }
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  isLoggedIn: false,
  users: [],
  login: () => ({ ok: false, error: 'Auth provider not initialized' }),
  signup: () => ({ ok: false, error: 'Auth provider not initialized' }),
  logout: () => {},
  updateProfile: () => {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [users, setUsers] = useState<AuthUser[]>(() => createDefaultUsers());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    try {
      const rawUsers = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
      let loadedUsers = createDefaultUsers();
      if (rawUsers) {
        const parsed = JSON.parse(rawUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedUsers = parsed.filter((u): u is AuthUser =>
            Boolean(
              u &&
              typeof u.id === 'string' &&
              typeof u.email === 'string' &&
              u.profile,
            ),
          );
        }
      }
      setUsers(loadedUsers);

      const sessionUserId = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      if (sessionUserId && loadedUsers.some((u) => u.id === sessionUserId)) {
        setCurrentUserId(sessionUserId);
      }
    } catch {
      /* Browser storage is optional. */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
      if (currentUserId) {
        localStorage.setItem(AUTH_SESSION_STORAGE_KEY, currentUserId);
      } else {
        localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      }
    } catch {
      /* Browser storage is optional. */
    }
  }, [users, currentUserId, ready]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId],
  );

  const login = useCallback(
    (email: string, password: string): AuthActionResult => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) {
        return { ok: false, error: 'Please enter both email and password.' };
      }
      const matched = users.find(
        (u) =>
          u.email.trim().toLowerCase() === normalizedEmail &&
          u.password === password,
      );
      if (!matched) {
        return {
          ok: false,
          error: 'Invalid email or password. Try the demo account or sign up.',
        };
      }
      setCurrentUserId(matched.id);
      syncWorkspaceStorageProfile(matched.profile);
      return { ok: true, user: matched };
    },
    [users],
  );

  const signup = useCallback(
    (formData: SignupFormData): AuthActionResult => {
      const name = formData.name.trim();
      const email = formData.email.trim().toLowerCase();
      const password = formData.password;
      const currentRole =
        (formData.currentRole ?? '').trim() || 'Operations Coordinator';
      if (!name) {
        return { ok: false, error: 'Please enter your name.' };
      }
      if (!email || !email.includes('@')) {
        return { ok: false, error: 'Please enter a valid email address.' };
      }
      if (!password || password.length < 4) {
        return {
          ok: false,
          error: 'Password must be at least 4 characters.',
        };
      }
      if (users.some((u) => u.email.trim().toLowerCase() === email)) {
        return {
          ok: false,
          error: 'An account with this email already exists. Please log in.',
        };
      }
      const id = `user-${Date.now().toString(36).slice(-8)}`;
      const draft = createProfileDraft(id);
      const primaryInterest = formData.interest ?? 'data';
      const newProfile: Profile = {
        ...draft,
        id,
        name: name.slice(0, 60),
        currentRole: currentRole.slice(0, 100),
        hours: Math.min(40, Math.max(1, Number(formData.hours ?? 6))),
        budget: Math.min(100000, Math.max(0, Number(formData.budget ?? 450))),
        weeks: Math.min(52, Math.max(1, Number(formData.weeks ?? 12))),
        interests: [primaryInterest],
        customInterests: [],
        skills: {
          ...draft.skills,
          excel: 2,
          communication: 2,
          critical: 2,
          data: primaryInterest === 'data' ? 2 : 1,
          stakeholder: primaryInterest === 'people' ? 2 : 1,
          process: primaryInterest === 'operations' ? 2 : 1,
          sustainability: primaryInterest === 'sustainability' ? 2 : 1,
        },
        completed: [],
      };
      const validated = profileSchema.safeParse(newProfile);
      const finalProfile = validated.success ? validated.data : newProfile;
      const newUser: AuthUser = {
        id,
        name: finalProfile.name,
        email,
        password,
        currentRole: finalProfile.currentRole,
        profile: finalProfile,
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUserId(newUser.id);
      syncWorkspaceStorageProfile(finalProfile);
      return { ok: true, user: newUser };
    },
    [users],
  );

  const logout = useCallback(() => {
    setCurrentUserId(null);
  }, []);

  const updateProfile = useCallback(
    (newData: Partial<Profile> | Profile) => {
      setUsers((prev) => {
        if (!currentUserId) return prev;
        return prev.map((user) => {
          if (user.id !== currentUserId) return user;
          const merged: Profile = {
            ...user.profile,
            ...newData,
            id: user.profile.id,
          };
          const parsed = profileSchema.safeParse(merged);
          const nextProfile = parsed.success ? parsed.data : merged;
          syncWorkspaceStorageProfile(nextProfile);
          return {
            ...user,
            name: nextProfile.name,
            currentRole: nextProfile.currentRole,
            profile: nextProfile,
          };
        });
      });
    },
    [currentUserId],
  );

  const openAuthModal = useCallback((mode: 'login' | 'signup' = 'login') => {
    setModalMode(mode);
    setModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setModalOpen(false);
    if (!pathname?.startsWith('/workspace')) {
      router.push('/workspace');
    }
  }, [pathname, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isLoggedIn: Boolean(currentUser),
      users,
      login,
      signup,
      logout,
      updateProfile,
      openAuthModal,
      closeAuthModal,
    }),
    [
      currentUser,
      users,
      login,
      signup,
      logout,
      updateProfile,
      openAuthModal,
      closeAuthModal,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modalOpen && (
        <AuthModalDialog
          initialMode={modalMode}
          onClose={closeAuthModal}
          onSuccess={handleAuthSuccess}
          login={login}
          signup={signup}
          t={t}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function AuthModalDialog({
  initialMode,
  onClose,
  onSuccess,
  login,
  signup,
  t,
}: {
  initialMode: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  login: (email: string, password: string) => AuthActionResult;
  signup: (formData: SignupFormData) => AuthActionResult;
  t: (key: string) => string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [error, setError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('aina@arctalent.my');
  const [loginPassword, setLoginPassword] = useState('demo1234');

  // Sign up form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('Operations Coordinator');
  const [signupHours, setSignupHours] = useState(6);
  const [signupInterest, setSignupInterest] = useState<
    'data' | 'people' | 'operations' | 'sustainability'
  >('data');

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode]);

  useEffect(() => {
    const el = dialogRef.current;
    const previousFocus = document.activeElement;
    el?.showModal();
    return () => {
      el?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={
        mode === 'login'
          ? t('Log in to ArcTalent')
          : t('Create your ArcTalent account')
      }
    >
      <div className="auth-modal-header">
        <div>
          <span className="eyebrow">
            <Sparkles size={13} /> {t('ARCTALENT ACCOUNT')}
          </span>
          <h2>
            {mode === 'login'
              ? t('Welcome back to your Command Center')
              : t('Create your learner profile')}
          </h2>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label={t('Close dialog')}
        >
          <X size={20} />
        </button>
      </div>

      <div className="auth-modal-body">
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            <LogIn size={16} />
            {t('Log in')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setError('');
            }}
          >
            <UserPlus size={16} />
            {t('Sign up')}
          </button>
        </div>

        {mode === 'login' ? (
          <form
            className="auth-card"
            onSubmit={(e) => {
              e.preventDefault();
              const result = login(loginEmail, loginPassword);
              if (!result.ok || !result.user) {
                setError(result.error ?? 'Login failed.');
                return;
              }
              onSuccess(result.user);
            }}
          >
            <div className="auth-demo-helper">
              <span>{t('Demo credentials ready for judges:')}</span>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('aina@arctalent.my');
                  setLoginPassword('demo1234');
                  setError('');
                }}
              >
                {t('Fill Aina (Demo)')}
              </button>
            </div>

            <label>
              {t('Email address')}
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="aina@arctalent.my"
              />
            </label>

            <label>
              {t('Password')}
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error && (
              <p className="auth-error" role="alert">
                {t(error)}
              </p>
            )}

            <button type="submit" className="primary full">
              {t('Log in & open Command Center')}
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form
            className="auth-card"
            onSubmit={(e) => {
              e.preventDefault();
              const result = signup({
                name: signupName,
                email: signupEmail,
                password: signupPassword,
                currentRole: signupRole,
                hours: signupHours,
                interest: signupInterest,
              });
              if (!result.ok || !result.user) {
                setError(result.error ?? 'Sign up failed.');
                return;
              }
              onSuccess(result.user);
            }}
          >
            <div className="auth-two-col">
              <label>
                {t('Full name')}
                <input
                  type="text"
                  required
                  maxLength={60}
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Dihom Chan"
                />
              </label>
              <label>
                {t('Current role')}
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value)}
                  placeholder="e.g. Operations Analyst"
                />
              </label>
            </div>

            <div className="auth-two-col">
              <label>
                {t('Email address')}
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                {t('Password')}
                <input
                  type="password"
                  required
                  minLength={4}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 4 characters"
                />
              </label>
            </div>

            <div className="auth-two-col">
              <label>
                {t('Primary career interest')}
                <select
                  value={signupInterest}
                  onChange={(e) =>
                    setSignupInterest(
                      e.target.value as
                        'data' | 'people' | 'operations' | 'sustainability',
                    )
                  }
                >
                  <option value="data">{t('Data & AI workflows')}</option>
                  <option value="operations">
                    {t('Operations & logistics')}
                  </option>
                  <option value="people">
                    {t('People & digital enablement')}
                  </option>
                  <option value="sustainability">
                    {t('Sustainability & reporting')}
                  </option>
                </select>
              </label>
              <label>
                {t('Study hours / week')}
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={signupHours}
                  onChange={(e) => setSignupHours(Number(e.target.value) || 6)}
                />
              </label>
            </div>

            {error && (
              <p className="auth-error" role="alert">
                {t(error)}
              </p>
            )}

            <button type="submit" className="primary full">
              {t('Sign up & open Command Center')}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <p className="auth-note">
          {t(
            'Demo prototype: accounts and profile edits are saved locally in your browser (localStorage).',
          )}
        </p>
      </div>
    </dialog>
  );
}
