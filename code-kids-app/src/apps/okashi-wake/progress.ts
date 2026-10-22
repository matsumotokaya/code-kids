import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mergeResult, type Profile } from '../../store/progress';
import type { UserId } from '../../store/session';

interface OkashiProgressState {
  users: Record<UserId, Profile>;
  /** `tries` is stored in `bestSlots`: the fewest predictions a stage took. */
  recordResult: (user: UserId, levelId: number, stars: number, tries: number) => void;
}

export const useOkashiProgress = create<OkashiProgressState>()(
  persist(
    (set) => ({
      users: { seigen: {}, amane: {}, miku: {}, kaya: {} },
      recordResult: (user, levelId, stars, tries) =>
        set((s) => {
          const profile = s.users[user] ?? {};
          return { users: { ...s.users, [user]: { ...profile, [levelId]: mergeResult(profile[levelId], stars, tries) } } };
        }),
    }),
    { name: 'code-kids-okashi-wake', version: 1 },
  ),
);
