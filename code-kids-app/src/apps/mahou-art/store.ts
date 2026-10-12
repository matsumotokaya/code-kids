import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserId } from '../../store/session';
import { compactStroke, trimStrokes, type ColorMode, type Stroke } from './pattern';

export interface ArtState {
  copies: number;
  color: ColorMode;
  strokes: Stroke[];
}

/** Keeps the saved drawing well under localStorage limits (about 300 KB as JSON). */
const MAX_SAVED_POINTS = 12000;

export const DEFAULT_ART: ArtState = { copies: 6, color: 'rainbow', strokes: [] };

interface MahouArtStore {
  users: Partial<Record<UserId, ArtState>>;
  setCopies: (user: UserId, copies: number) => void;
  setColor: (user: UserId, color: ColorMode) => void;
  addStroke: (user: UserId, stroke: Stroke) => void;
  undo: (user: UserId) => void;
  clear: (user: UserId) => void;
}

export const useMahouArt = create<MahouArtStore>()(
  persist(
    (set) => {
      const patch = (user: UserId, change: (art: ArtState) => Partial<ArtState>) =>
        set((s) => {
          const art = s.users[user] ?? DEFAULT_ART;
          return { users: { ...s.users, [user]: { ...art, ...change(art) } } };
        });
      return {
        users: {},
        setCopies: (user, copies) => patch(user, () => ({ copies })),
        setColor: (user, color) => patch(user, () => ({ color })),
        addStroke: (user, stroke) => patch(user, (art) => ({ strokes: trimStrokes([...art.strokes, compactStroke(stroke)], MAX_SAVED_POINTS) })),
        undo: (user) => patch(user, (art) => ({ strokes: art.strokes.slice(0, -1) })),
        clear: (user) => patch(user, () => ({ strokes: [] })),
      };
    },
    { name: 'code-kids-mahou-art', version: 1 },
  ),
);
