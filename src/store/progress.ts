import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CharacterId = 'robo' | 'neko' | 'usagi';

export interface LevelResult {
  stars: number;
  bestSlots: number;
}

export type Profile = Record<number, LevelResult>;

interface ProgressState {
  character: CharacterId | null;
  soundOn: boolean;
  profiles: Record<CharacterId, Profile>;
  setCharacter: (id: CharacterId) => void;
  toggleSound: () => void;
  recordResult: (character: CharacterId, levelId: number, stars: number, slots: number) => void;
}

const emptyProfiles = (): Record<CharacterId, Profile> => ({ robo: {}, neko: {}, usagi: {} });

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      character: null,
      soundOn: true,
      profiles: emptyProfiles(),
      setCharacter: (id) => set({ character: id }),
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
      recordResult: (character, levelId, stars, slots) =>
        set((s) => {
          const profile = s.profiles[character] ?? {};
          const prev = profile[levelId];
          const next: LevelResult = prev
            ? { stars: Math.max(prev.stars, stars), bestSlots: Math.min(prev.bestSlots, slots) }
            : { stars, bestSlots: slots };
          return { profiles: { ...s.profiles, [character]: { ...profile, [levelId]: next } } };
        }),
    }),
    { name: 'code-kids-progress', version: 1 },
  ),
);

export function totalStars(profile: Profile): number {
  return Object.values(profile).reduce((sum, r) => sum + r.stars, 0);
}

/** A level is playable when it is the first one or the previous level has been cleared. */
export function isUnlocked(profile: Profile, levelId: number): boolean {
  return levelId === 1 || (profile[levelId - 1]?.stars ?? 0) > 0;
}
