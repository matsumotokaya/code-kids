import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mergeResult, type Profile } from '../../store/progress';
import type { UserId } from '../../store/session';
import type { Pattern, Tempo } from './types';

/** The じゆうに つくる song, saved per person like the まほうのアート drawing. */
export interface FreeSong {
  pattern: Pattern;
  tempo: Tempo;
}

interface RhythmProgressState {
  users: Record<UserId, Profile>;
  free: Partial<Record<UserId, FreeSong>>;
  /** `tries` is stored in `bestSlots`: the fewest 「くらべる！」 a stage took. */
  recordResult: (user: UserId, levelId: number, stars: number, tries: number) => void;
  saveFree: (user: UserId, song: FreeSong) => void;
}

export const useRhythmProgress = create<RhythmProgressState>()(
  persist(
    (set) => ({
      users: { seigen: {}, amane: {}, miku: {}, kaya: {} },
      free: {},
      recordResult: (user, levelId, stars, tries) =>
        set((s) => {
          const profile = s.users[user] ?? {};
          return { users: { ...s.users, [user]: { ...profile, [levelId]: mergeResult(profile[levelId], stars, tries) } } };
        }),
      saveFree: (user, song) => set((s) => ({ free: { ...s.free, [user]: song } })),
    }),
    { name: 'code-kids-rhythm-machine', version: 1 },
  ),
);
