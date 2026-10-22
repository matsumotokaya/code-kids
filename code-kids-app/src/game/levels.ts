import type { Level } from './types';

export const LEVELS: Level[] = [
  {
    id: 1,
    title: 'はじめの いっぽ',
    hint: '「みぎ」の カードを 2まい ならべて、おほしさまを とりにいこう！',
    size: 5,
    start: { x: 0, y: 2 },
    facing: 'right',
    stars: [{ x: 2, y: 2 }],
    rocks: [],
    water: [],
    cards: ['right'],
    slots: 4,
    par: 2,
  },
  {
    id: 2,
    title: 'うえにも いけるよ',
    hint: '「みぎ」と「うえ」を くみあわせよう。じゅんばんは じゆうだよ！',
    size: 5,
    start: { x: 1, y: 3 },
    facing: 'right',
    stars: [{ x: 3, y: 1 }],
    rocks: [],
    water: [],
    cards: ['right', 'up'],
    slots: 5,
    par: 4,
  },
  {
    id: 3,
    title: 'ほしが ふたつ',
    hint: 'おほしさまは ぜんぶ とろう！ どっちから とる？',
    size: 5,
    start: { x: 0, y: 2 },
    facing: 'right',
    stars: [
      { x: 2, y: 2 },
      { x: 2, y: 0 },
    ],
    rocks: [],
    water: [],
    cards: ['right', 'up', 'down', 'left'],
    slots: 6,
    par: 4,
  },
  {
    id: 4,
    title: 'いわを よけて',
    hint: 'いわには ぶつかれないよ。うえか したから まわりこもう！',
    size: 5,
    start: { x: 0, y: 2 },
    facing: 'right',
    stars: [{ x: 4, y: 2 }],
    rocks: [{ x: 2, y: 2 }],
    water: [],
    cards: ['right', 'up', 'down'],
    slots: 8,
    par: 6,
  },
  {
    id: 5,
    title: 'いけに おちないで',
    hint: 'みずに はいると びしょぬれ！ いけの まわりを とおろう。',
    size: 5,
    start: { x: 0, y: 4 },
    facing: 'up',
    stars: [{ x: 3, y: 3 }],
    rocks: [],
    water: [
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
    ],
    cards: ['right', 'up', 'down'],
    slots: 8,
    par: 6,
  },
  {
    id: 6,
    title: 'いわの かべ',
    hint: 'かべの どこかに すきまが あるよ。よく みてみよう！',
    size: 6,
    start: { x: 0, y: 3 },
    facing: 'right',
    stars: [{ x: 3, y: 3 }],
    rocks: [
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
      { x: 2, y: 5 },
    ],
    water: [],
    cards: ['right', 'up', 'down', 'left'],
    slots: 8,
    par: 7,
  },
  {
    id: 7,
    title: 'ほしを みっつ',
    hint: 'みっつ ぜんぶ とるには どう まわる？ カードは 8まいまで！',
    size: 6,
    start: { x: 0, y: 5 },
    facing: 'up',
    stars: [
      { x: 0, y: 3 },
      { x: 3, y: 3 },
      { x: 3, y: 5 },
    ],
    rocks: [{ x: 5, y: 0 }],
    water: [
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
    ],
    cards: ['right', 'up', 'down', 'left'],
    slots: 8,
    par: 7,
  },
  {
    id: 8,
    title: '×2 の まほう',
    hint: 'カードを おいたあと「2かい」を おすと、2かい すすむ！ カードは 2まいしか つかえないよ。',
    size: 5,
    start: { x: 0, y: 2 },
    facing: 'right',
    stars: [{ x: 4, y: 2 }],
    rocks: [
      { x: 1, y: 0 },
      { x: 3, y: 4 },
    ],
    water: [],
    cards: ['right', 'x2'],
    slots: 2,
    par: 2,
  },
  {
    id: 9,
    title: '×3 で ひとっとび',
    hint: '「3かい」で 3マス すすむよ。3 + 3 = 6 だね！',
    size: 7,
    start: { x: 0, y: 6 },
    facing: 'right',
    stars: [{ x: 6, y: 0 }],
    rocks: [
      { x: 2, y: 4 },
      { x: 4, y: 2 },
      { x: 1, y: 1 },
    ],
    water: [
      { x: 3, y: 5 },
      { x: 4, y: 5 },
      { x: 5, y: 3 },
      { x: 5, y: 4 },
    ],
    cards: ['right', 'up', 'x3'],
    slots: 5,
    par: 4,
  },
  {
    id: 10,
    title: 'かけざん めいろ',
    hint: '3マス、3マス、3マス、3マス で ゴール！「3かい」を うまく つかおう。',
    size: 7,
    start: { x: 0, y: 0 },
    facing: 'down',
    stars: [{ x: 6, y: 6 }],
    rocks: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 4, y: 3 },
      { x: 4, y: 4 },
      { x: 2, y: 5 },
      { x: 1, y: 6 },
      { x: 5, y: 5 },
      { x: 6, y: 2 },
      { x: 5, y: 0 },
    ],
    water: [
      { x: 5, y: 1 },
      { x: 6, y: 1 },
      { x: 0, y: 5 },
      { x: 0, y: 6 },
    ],
    cards: ['right', 'down', 'x2', 'x3'],
    slots: 6,
    par: 4,
  },
  {
    id: 11,
    title: 'ほしあつめ ×2',
    hint: 'まんなかに もどりながら、4つの おほしさまを ぜんぶ とろう！',
    size: 7,
    start: { x: 3, y: 3 },
    facing: 'up',
    stars: [
      { x: 3, y: 1 },
      { x: 5, y: 3 },
      { x: 3, y: 5 },
      { x: 1, y: 3 },
    ],
    rocks: [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 0, y: 6 },
      { x: 6, y: 6 },
    ],
    water: [
      { x: 1, y: 1 },
      { x: 5, y: 5 },
    ],
    cards: ['up', 'down', 'left', 'right', 'x2'],
    slots: 8,
    par: 7,
  },
  {
    id: 12,
    title: 'さいごの ちょうせん',
    hint: 'ぜんぶの カードを つかって かんがえよう。みずに おちないように！',
    size: 7,
    start: { x: 0, y: 3 },
    facing: 'right',
    stars: [
      { x: 3, y: 0 },
      { x: 3, y: 6 },
      { x: 6, y: 3 },
    ],
    rocks: [
      { x: 4, y: 1 },
      { x: 4, y: 5 },
      { x: 6, y: 0 },
      { x: 6, y: 6 },
    ],
    water: [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 4 },
      { x: 2, y: 5 },
      { x: 2, y: 6 },
    ],
    cards: ['up', 'down', 'left', 'right', 'x2', 'x3'],
    slots: 8,
    par: 6,
  },
];

/**
 * World 2 release switch. While false, World 2 exists only in `npm run dev`: production shows World 1
 * exactly as before (no tabs, no World 2 stages, `getLevel` cannot reach them).
 * To release: set this to true. Nothing else needs to change.
 */
export const WORLD2_RELEASED = false;
export const WORLD2_VISIBLE = WORLD2_RELEASED || import.meta.env.DEV;

/** World 2 ids start here so they never collide with World 1, which may still grow up to 100 stages. */
export const WORLD2_FIRST_ID = 101;

/**
 * World 2: くりかえし (loops) and 「なおして！」 (debugging) for the 8-year-old.
 *
 * Unlocking: stage 101 opens when World 1's last stage is cleared; after that each stage opens when
 * the one before it is cleared, as in World 1 (see `isLevelUnlocked`).
 *
 * Card counting (par / slots / stars): every card in the strip is 1, including 「くりかえし」 and 「おわり」.
 * 2かい / 3かい are free as in World 1. `npm test` checks par with the loop-aware solver, and for
 * loop stages also checks that the same stage written with arrows only would not fit in `slots`.
 */
export const WORLD2_LEVELS: Level[] = [
  {
    id: 101,
    world: 2,
    title: 'くりかえしの まほう',
    hint: '「くりかえし」→「みぎ」→「うえ」→「おわり」と ならべると、みぎ・うえ を 3かい くりかえすよ！',
    size: 5,
    start: { x: 0, y: 4 },
    facing: 'up',
    stars: [
      { x: 1, y: 3 },
      { x: 2, y: 2 },
      { x: 3, y: 1 },
    ],
    rocks: [{ x: 4, y: 0 }],
    water: [
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ],
    cards: ['right', 'up', 'loop3', 'end'],
    slots: 4,
    par: 4,
  },
  {
    id: 102,
    world: 2,
    title: 'おおきな かいだん',
    hint: 'ひとつの だんは「みぎ・みぎ・うえ」。それを 3かい くりかえそう！',
    size: 7,
    start: { x: 0, y: 6 },
    facing: 'right',
    stars: [
      { x: 2, y: 5 },
      { x: 4, y: 4 },
      { x: 6, y: 3 },
    ],
    rocks: [
      { x: 1, y: 5 },
      { x: 3, y: 4 },
      { x: 5, y: 3 },
    ],
    water: [
      { x: 5, y: 6 },
      { x: 6, y: 6 },
    ],
    cards: ['right', 'up', 'loop3', 'end'],
    slots: 6,
    par: 5,
  },
  {
    id: 103,
    world: 2,
    title: 'なおして！ まちがい さがし',
    hint: 'まず「うごけ！」で うごかして みよう。へんな ところで まがった カードを タップして けして、ただしい カードを いれよう。',
    size: 6,
    start: { x: 0, y: 5 },
    facing: 'up',
    stars: [
      { x: 0, y: 3 },
      { x: 2, y: 3 },
      { x: 4, y: 3 },
    ],
    rocks: [
      { x: 2, y: 4 },
      { x: 3, y: 4 },
    ],
    water: [
      { x: 2, y: 5 },
      { x: 3, y: 5 },
    ],
    cards: ['up', 'down', 'right'],
    slots: 6,
    par: 6,
    buggy: 'up down right right right right',
    fixed: 'up up right right right right',
    bugs: 1,
  },
  {
    id: 104,
    world: 2,
    title: 'ギザギザ やま',
    hint: 'やまが 2つ。「うえ・みぎ・した・みぎ」を 2かい くりかえそう！',
    size: 5,
    start: { x: 0, y: 3 },
    facing: 'right',
    stars: [
      { x: 1, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 2 },
      { x: 4, y: 3 },
    ],
    rocks: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
    ],
    water: [
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ],
    cards: ['up', 'down', 'right', 'loop2', 'end'],
    slots: 6,
    par: 6,
  },
  {
    id: 105,
    world: 2,
    title: 'なおして！ なんかい？',
    hint: 'くりかえす かずが たりないみたい。「くりかえし」の カードを タップして けして、ちがう かずの カードを いれよう。',
    size: 7,
    start: { x: 0, y: 0 },
    facing: 'down',
    stars: [
      { x: 2, y: 1 },
      { x: 4, y: 2 },
      { x: 6, y: 3 },
    ],
    rocks: [
      { x: 1, y: 0 },
      { x: 3, y: 1 },
      { x: 5, y: 2 },
    ],
    water: [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 0, y: 6 },
      { x: 1, y: 6 },
    ],
    cards: ['down', 'right', 'loop2', 'loop3', 'end'],
    slots: 6,
    par: 5,
    buggy: 'loop2 down right right end',
    fixed: 'loop3 down right right end',
    bugs: 1,
  },
  {
    id: 106,
    world: 2,
    title: 'くしの は',
    hint: '「2かい」は 1まいの カードを、「くりかえし」は ならんだ カードを ぜんぶ くりかえすよ。りょうほう つかおう！',
    size: 5,
    start: { x: 0, y: 4 },
    facing: 'up',
    stars: [
      { x: 0, y: 2 },
      { x: 2, y: 2 },
      { x: 4, y: 2 },
    ],
    rocks: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 3, y: 3 },
    ],
    water: [],
    cards: ['up', 'down', 'right', 'x2', 'loop3', 'end'],
    slots: 6,
    par: 5,
  },
  {
    id: 107,
    world: 2,
    title: 'かいだんの さきへ',
    hint: 'かいだんを のぼったら、さいごは まっすぐ。「おわり」の あとにも カードを おけるよ。',
    size: 7,
    start: { x: 0, y: 6 },
    facing: 'right',
    stars: [
      { x: 1, y: 5 },
      { x: 2, y: 4 },
      { x: 3, y: 3 },
      { x: 6, y: 3 },
    ],
    rocks: [
      { x: 4, y: 1 },
      { x: 5, y: 1 },
      { x: 2, y: 6 },
      { x: 3, y: 6 },
    ],
    water: [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
    ],
    cards: ['right', 'up', 'x3', 'loop3', 'end'],
    slots: 6,
    par: 5,
  },
  {
    id: 108,
    world: 2,
    title: 'なおして！ おわりは どこ？',
    hint: '「おわり」の ばしょが ちがうみたい。くりかえすのは どこまで かな？',
    size: 5,
    start: { x: 0, y: 0 },
    facing: 'right',
    stars: [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
    ],
    rocks: [{ x: 0, y: 4 }],
    water: [
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ],
    cards: ['right', 'down', 'loop3', 'end'],
    slots: 6,
    par: 5,
    buggy: 'loop3 right down right end',
    fixed: 'loop3 right down end right',
    bugs: 1,
  },
  {
    id: 109,
    world: 2,
    title: 'やまのぼり',
    hint: 'のぼって、くだる。「くりかえし」は 2つ つかっても いいんだよ。',
    size: 7,
    start: { x: 0, y: 6 },
    facing: 'right',
    stars: [
      { x: 1, y: 5 },
      { x: 2, y: 4 },
      { x: 3, y: 3 },
      { x: 4, y: 4 },
      { x: 5, y: 5 },
      { x: 6, y: 6 },
    ],
    rocks: [
      { x: 2, y: 6 },
      { x: 3, y: 6 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
      { x: 3, y: 5 },
      { x: 4, y: 5 },
    ],
    water: [],
    cards: ['right', 'up', 'down', 'loop3', 'end'],
    slots: 9,
    par: 8,
  },
  {
    id: 110,
    world: 2,
    title: 'なおして！ さいごの なぞ',
    hint: 'まちがいは 2こ。いっこ なおしたら、もういちど うごかして たしかめよう！',
    size: 7,
    start: { x: 0, y: 1 },
    facing: 'right',
    stars: [
      { x: 1, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 3 },
      { x: 5, y: 2 },
      { x: 6, y: 1 },
    ],
    rocks: [
      { x: 0, y: 5 },
      { x: 6, y: 5 },
    ],
    water: [
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 3, y: 2 },
    ],
    cards: ['right', 'up', 'down', 'loop2', 'loop3', 'end'],
    slots: 9,
    par: 8,
    buggy: 'loop3 right up end loop2 right up end',
    fixed: 'loop3 right down end loop3 right up end',
    bugs: 2,
  },
];

export const TOTAL_STARS = LEVELS.length * 3;

/** The stages a world shows on the map. World 2 is empty until it is visible. */
export function worldLevels(world: 1 | 2): Level[] {
  if (world === 1) return LEVELS;
  return WORLD2_VISIBLE ? WORLD2_LEVELS : [];
}

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id) ?? (WORLD2_VISIBLE ? WORLD2_LEVELS.find((l) => l.id === id) : undefined);
}

/** Number shown to the child: World 2 starts again from 1. */
export function stageNumber(level: Pick<Level, 'id'>): number {
  return level.id >= WORLD2_FIRST_ID ? level.id - WORLD2_FIRST_ID + 1 : level.id;
}

/**
 * Same rule as World 1 (the previous stage is cleared), except that the first World 2 stage
 * waits for the last World 1 stage.
 */
export function isLevelUnlocked(cleared: (id: number) => boolean, levelId: number): boolean {
  if (levelId === 1) return true;
  if (levelId === WORLD2_FIRST_ID) return cleared(LEVELS[LEVELS.length - 1].id);
  return cleared(levelId - 1);
}
