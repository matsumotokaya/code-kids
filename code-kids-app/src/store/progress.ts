import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserId } from './session';

export type CharacterId = 'robo' | 'neko' | 'usagi';

export interface LevelResult {
  stars: number;
  bestSlots: number;
}

export type Profile = Record<number, LevelResult>;

/** Each login keeps the original per-character progress, so siblings never overwrite each other. */
export interface UserProgress {
  character: CharacterId | null;
  profiles: Record<CharacterId, Profile>;
}

interface ProgressState {
  soundOn: boolean;
  users: Record<UserId, UserProgress>;
  setCharacter: (user: UserId, id: CharacterId) => void;
  toggleSound: () => void;
  recordResult: (user: UserId, character: CharacterId, levelId: number, stars: number, slots: number) => void;
}

type PersistedProgress = Pick<ProgressState, 'soundOn' | 'users'>;

const emptyProfiles = (): Record<CharacterId, Profile> => ({ robo: {}, neko: {}, usagi: {} });
const emptyUser = (): UserProgress => ({ character: null, profiles: emptyProfiles() });

/**
 * v1 (before login existed) kept one set of character profiles per device.
 * Both children inherit it, so nobody loses the stars they already earned.
 */
export function migrateProgress(persisted: unknown, version: number): PersistedProgress {
  if (version >= 2) return persisted as PersistedProgress;
  const old = (persisted ?? {}) as { character?: CharacterId | null; soundOn?: boolean; profiles?: Partial<Record<CharacterId, Profile>> };
  const inherit = (): UserProgress => ({
    character: old.character ?? null,
    profiles: { ...emptyProfiles(), ...(JSON.parse(JSON.stringify(old.profiles ?? {})) as Partial<Record<CharacterId, Profile>>) },
  });
  return { soundOn: old.soundOn ?? true, users: { seigen: inherit(), amane: inherit() } };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      soundOn: true,
      users: { seigen: emptyUser(), amane: emptyUser() },
      setCharacter: (user, id) =>
        set((s) => ({ users: { ...s.users, [user]: { ...(s.users[user] ?? emptyUser()), character: id } } })),
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
      recordResult: (user, character, levelId, stars, slots) =>
        set((s) => {
          const progress = s.users[user] ?? emptyUser();
          const profile = progress.profiles[character] ?? {};
          const next = mergeResult(profile[levelId], stars, slots);
          return {
            users: {
              ...s.users,
              [user]: { ...progress, profiles: { ...progress.profiles, [character]: { ...profile, [levelId]: next } } },
            },
          };
        }),
    }),
    {
      name: 'code-kids-progress',
      version: 2,
      migrate: (persisted, version) => migrateProgress(persisted, version) as ProgressState,
    },
  ),
);

/** Keeps the best stars and the fewest cards ever achieved on a level. */
export function mergeResult(prev: LevelResult | undefined, stars: number, slots: number): LevelResult {
  return prev ? { stars: Math.max(prev.stars, stars), bestSlots: Math.min(prev.bestSlots, slots) } : { stars, bestSlots: slots };
}

export function totalStars(profile: Profile): number {
  return Object.values(profile).reduce((sum, r) => sum + r.stars, 0);
}

/** A level is playable when it is the first one or the previous level has been cleared. */
export function isUnlocked(profile: Profile, levelId: number): boolean {
  return levelId === 1 || (profile[levelId - 1]?.stars ?? 0) > 0;
}
