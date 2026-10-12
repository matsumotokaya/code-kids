import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppId } from '../apps/catalog';

export type UserId = 'seigen' | 'amane' | 'miku' | 'kaya';

export interface UserMeta {
  id: UserId;
  name: string;
  password: string;
  color: string;
}

/**
 * Pretend accounts. The children asked for a login screen, not for security:
 * the passwords live in the bundle and only decide whose progress to show.
 */
export const USERS: UserMeta[] = [
  { id: 'seigen', name: 'SEIGEN', password: 'SEIGEN', color: '#3b82f6' },
  { id: 'amane', name: 'AMANE', password: 'AMANE', color: '#f97316' },
  { id: 'miku', name: 'MIKU', password: 'MIKU', color: '#14b8a6' },
  { id: 'kaya', name: 'KAYA', password: 'KAYA', color: '#8b5cf6' },
];

export function userMeta(id: UserId): UserMeta {
  return USERS.find((u) => u.id === id) ?? USERS[0];
}

/** Case and surrounding spaces are ignored so a tablet keyboard's auto-capitalization never locks a child out. */
export function userForPassword(input: string): UserId | null {
  const typed = input.trim().toUpperCase();
  return USERS.find((u) => u.password === typed)?.id ?? null;
}

interface SessionState {
  user: UserId | null;
  installed: Record<UserId, AppId[]>;
  /** Simulated download progress (0-100) for the current user. Not persisted. */
  downloads: Partial<Record<AppId, number>>;
  login: (user: UserId) => void;
  logout: () => void;
  startDownload: (app: AppId, onDone?: () => void) => void;
  uninstall: (app: AppId) => void;
}

const TICK_MS = 120;
/** How long 100% stays on screen before the app turns into "open". */
const FINISH_HOLD_MS = 600;

const timers = new Map<AppId, ReturnType<typeof setInterval>>();

function stopAllDownloads(): void {
  timers.forEach((t) => clearInterval(t));
  timers.clear();
}

/** Uneven steps with occasional stalls, so the bar feels like a real download (about 6 seconds). */
function nextStep(): number {
  return Math.random() < 0.12 ? 0 : 0.5 + Math.random() * 3.5;
}

function without<K extends string, V>(record: Partial<Record<K, V>>, key: K): Partial<Record<K, V>> {
  const copy = { ...record };
  delete copy[key];
  return copy;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      installed: { seigen: [], amane: [], miku: [], kaya: [] },
      downloads: {},
      login: (user) => set({ user }),
      logout: () => {
        stopAllDownloads();
        set({ user: null, downloads: {} });
      },
      startDownload: (app, onDone) => {
        const { user, installed, downloads } = get();
        if (!user || installed[user]?.includes(app) || downloads[app] !== undefined) return;
        set({ downloads: { ...downloads, [app]: 0 } });
        const timer = setInterval(() => {
          const current = get().downloads[app];
          if (current === undefined) {
            clearInterval(timer);
            timers.delete(app);
            return;
          }
          const next = Math.min(100, current + nextStep());
          set((s) => ({ downloads: { ...s.downloads, [app]: next } }));
          if (next < 100) return;
          clearInterval(timer);
          timers.delete(app);
          setTimeout(() => {
            if (get().user !== user) return;
            set((s) => ({
              downloads: without(s.downloads, app),
              installed: { ...s.installed, [user]: [...(s.installed[user] ?? []), app] },
            }));
            onDone?.();
          }, FINISH_HOLD_MS);
        }, TICK_MS);
        timers.set(app, timer);
      },
      uninstall: (app) => {
        const { user } = get();
        if (!user) return;
        set((s) => ({ installed: { ...s.installed, [user]: (s.installed[user] ?? []).filter((a) => a !== app) } }));
      },
    }),
    {
      name: 'code-kids-session',
      version: 1,
      partialize: (s) => ({ user: s.user, installed: s.installed }),
    },
  ),
);
