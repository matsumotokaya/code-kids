import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mergeResult, type Profile } from '../../store/progress';
import type { UserId } from '../../store/session';

interface JumpProgressState {
  users: Record<UserId, Profile>;
  recordResult: (user: UserId, levelId: number, stars: number, cards: number) => void;
}

export const useJumpProgress = create<JumpProgressState>()(
  persist(
    (set) => ({
      users: { seigen: {}, amane: {}, miku: {}, kaya: {}, guest: {} },
      recordResult: (user, levelId, stars, cards) =>
        set((s) => {
          const profile = s.users[user] ?? {};
          return { users: { ...s.users, [user]: { ...profile, [levelId]: mergeResult(profile[levelId], stars, cards) } } };
        }),
    }),
    { name: 'code-kids-pittari-jump', version: 1 },
  ),
);
