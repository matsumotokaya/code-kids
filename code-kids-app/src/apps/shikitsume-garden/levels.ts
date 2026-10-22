import type { GardenLevel, Point } from './types';

const column = (x: number, h: number): Point[] => Array.from({ length: h }, (_, y) => ({ x, y }));
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * One row first (plain counting), then two rows, then the ×3 ×4 ×5 tables with たて fixed,
 * then two beds in an L-shaped plot, choosing from a few cards, turning a card (3 × 4 = 4 × 3), and a mixed finale.
 * Count stages in between ask "how many?" for beds that are already drawn.
 */
export const GARDEN_LEVELS: GardenLevel[] = [
  {
    id: 1,
    title: '1れつに うえよう',
    hint: 'よこの かずを えらんで、つちを タップ。はなだんが できたら「うえる！」を おそう',
    kind: 'fill',
    w: 3,
    h: 1,
    stones: [],
    offer: { mode: 'pick', rows: [1], cols: [1, 2, 3], beds: 1 },
  },
  {
    id: 2,
    title: 'なんこ さくかな？',
    hint: 'よこに 1れつ ならんだ はなだん。はなは なんこ さくかな？ かずを えらんで「うえる！」',
    kind: 'count',
    w: 5,
    h: 1,
    beds: [{ x: 0, y: 0, rows: 1, cols: 5 }],
    choices: [4, 5, 6],
  },
  {
    id: 3,
    title: '2れつに うえよう',
    hint: 'つちは たてに 2れつ あるよ。たてと よこの かずを えらんで、ぴったりの はなだんを つくろう',
    kind: 'fill',
    w: 4,
    h: 2,
    stones: [],
    offer: { mode: 'pick', rows: [1, 2], cols: range(1, 4), beds: 1 },
  },
  {
    id: 4,
    title: '2の だん',
    hint: 'よこに 5こ ならんだ れつが、たてに 2つ。ぜんぶで なんこ？',
    kind: 'count',
    w: 5,
    h: 2,
    beds: [{ x: 0, y: 0, rows: 2, cols: 5 }],
    choices: [8, 10, 12],
  },
  {
    id: 5,
    title: '3の だん',
    hint: 'たては 3に きまって いるよ。いしの うえには うえられない。よこは いくつに する？',
    kind: 'fill',
    w: 6,
    h: 3,
    stones: column(5, 3),
    offer: { mode: 'pick', rows: [3], cols: range(1, 6), beds: 1 },
  },
  {
    id: 6,
    title: '4の だん',
    hint: 'まんなかに いしの みち。はなだんは 2つ つくれるよ。みちの ひだりと みぎ、よこは いくつ？',
    kind: 'fill',
    w: 6,
    h: 4,
    stones: column(3, 4),
    offer: { mode: 'pick', rows: [4], cols: range(1, 5), beds: 2 },
  },
  {
    id: 7,
    title: '5の だん',
    hint: 'たてに 5れつ、よこに 3こずつ。5 × 3 は いくつ かな？',
    kind: 'count',
    w: 3,
    h: 5,
    beds: [{ x: 0, y: 0, rows: 5, cols: 3 }],
    choices: [12, 15, 18, 20],
  },
  {
    id: 8,
    title: 'L の かたち',
    hint: 'しかくい はなだん 1つでは うまらないね。2つに わけて かんがえよう',
    kind: 'fill',
    w: 5,
    h: 4,
    stones: [
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
    ],
    offer: { mode: 'pick', rows: range(1, 4), cols: range(1, 5), beds: 2 },
  },
  {
    id: 9,
    title: 'どれを つかう？',
    hint: 'はなだんの カードは 4まい。ぜんぶ つかわなくて いいよ。ぴったり うまる くみあわせを さがそう',
    kind: 'fill',
    w: 6,
    h: 3,
    stones: [],
    offer: {
      mode: 'set',
      cards: [
        { rows: 3, cols: 4, turnable: false },
        { rows: 3, cols: 3, turnable: false },
        { rows: 2, cols: 2, turnable: false },
        { rows: 3, cols: 2, turnable: false },
      ],
    },
  },
  {
    id: 10,
    title: 'くるっと まわそう',
    hint: '3 × 4 の カードは「くるっ」で まわせるよ。まわすと 4 × 3 に なるね。はなの かずは かわるかな？',
    kind: 'fill',
    w: 6,
    h: 4,
    stones: [
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 5, y: 3 },
    ],
    offer: {
      mode: 'set',
      cards: [
        { rows: 3, cols: 4, turnable: true },
        { rows: 3, cols: 3, turnable: false },
      ],
    },
    lesson: '3 × 4 も 4 × 3 も 12。まわしても はなの かずは おなじ！',
  },
  {
    id: 11,
    title: 'ぜんぶで なんこ？',
    hint: 'はなだんが 2つ。1つずつ かけざんで かぞえて、あわせると いくつ？',
    kind: 'count',
    w: 4,
    h: 5,
    beds: [
      { x: 0, y: 0, rows: 3, cols: 4 },
      { x: 0, y: 3, rows: 2, cols: 2 },
    ],
    choices: [14, 16, 18],
  },
  {
    id: 12,
    title: 'さいごの ちょうせん',
    hint: 'はなだんは 3つまで。いしを よけて、ぜんぶの つちを うめよう',
    kind: 'fill',
    w: 6,
    h: 5,
    stones: [
      { x: 4, y: 0 },
      { x: 5, y: 0 },
      { x: 0, y: 4 },
      { x: 1, y: 4 },
    ],
    offer: { mode: 'pick', rows: range(1, 5), cols: range(1, 6), beds: 3 },
  },
];

export function getGardenLevel(id: number): GardenLevel | undefined {
  return GARDEN_LEVELS.find((l) => l.id === id);
}
