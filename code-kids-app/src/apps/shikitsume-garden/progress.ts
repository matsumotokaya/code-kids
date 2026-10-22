import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mergeResult, type Profile } from '../../store/progress';
import type { UserId } from '../../store/session';

interface ShikitsumeProgressState {
  users: Record<UserId, Profile>;
  /** `tries` is stored in `bestSlots`: the fewest runs of 「うえる！」 a stage took. */
  recordResult: (user: UserId, levelId: number, stars: number, tries: number) => void;
}

export const useShikitsumeProgress = create<ShikitsumeProgressState>()(
  persist(
    (set) => ({
      users: { seigen: {}, amane: {}, miku: {}, kaya: {} },
      recordResult: (user, levelId, stars, tries) =>
        set((s) => {
          const profile = s.users[user] ?? {};
          return {
            users: {
              ...s.users,
              [user]: {
                ...profile,
                [levelId]: mergeResult(profile[levelId], stars, tries),
              },
            },
          };
        }),
    }),
    { name: 'code-kids-shikitsume-garden', version: 1 },
  ),
);
