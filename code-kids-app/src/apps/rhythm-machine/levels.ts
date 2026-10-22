import type { RhythmLevel } from './types';

/**
 * まねっこ stages. 'x' is a note and '.' a rest; columns are eighth notes.
 * Ramp: one instrument with the answer drawn faintly → two → no faint answer → all four rows →
 * targets made of a repeated 2- or 4-step shape → くりかえし stages where the child builds
 * only the first part and the ×N button loops it. The tests check every stage with `levelProblems`.
 */
export const RHYTHM_LEVELS: RhythmLevel[] = [
  {
    id: 1,
    title: 'ドンを ならそう',
    hint: '「きく」で おてほんを きこう。くまさんの たいこが 2かい なるよ。うすい まるを タップして「くらべる！」を おしてね。',
    steps: 8,
    rows: ['don'],
    target: { don: 'x...x...' },
    ghost: true,
  },
  {
    id: 2,
    title: 'ドン ドン ドン ドン',
    hint: 'こんどは 4かい。ひとつ おきに ドン、ドン。「ならす！」で じぶんの おとも きけるよ。',
    steps: 8,
    rows: ['don'],
    target: { don: 'x.x.x.x.' },
    ghost: true,
  },
  {
    id: 3,
    title: 'ドンと タン',
    hint: 'うさぎさんの てびょうし タンが なかまに なったよ。ドンの あいだに タン。',
    steps: 8,
    rows: ['tan', 'don'],
    target: { tan: '..x...x.', don: 'x...x...' },
    ghost: true,
  },
  {
    id: 4,
    title: 'よく きいてね',
    hint: 'うすい まるは もう ないよ。おてほんを きくと、なった ところが ぴかっと ひかる。よく みて、よく きいて！',
    steps: 8,
    rows: ['chi', 'don'],
    target: { chi: 'x.x.x.x.', don: 'x...x...' },
    ghost: false,
  },
  {
    id: 5,
    title: 'さんにんで えんそう',
    hint: 'ひよこの チッ、うさぎの タン、くまの ドン。ひとつずつ きいて つくろう。',
    steps: 8,
    rows: ['chi', 'tan', 'don'],
    target: { chi: 'x.x.x.x.', tan: '..x...x.', don: 'x...x...' },
    ghost: false,
  },
  {
    id: 6,
    title: 'ポンも いっしょ',
    hint: 'ねこの すず ポンは、ばしょで おとの たかさが かわるよ。4にんの バンドだ！',
    steps: 8,
    rows: ['pon', 'chi', 'tan', 'don'],
    target: { pon: 'x.....x.', chi: 'x.x.x.x.', tan: '..x...x.', don: 'x...x...' },
    ghost: false,
  },
  {
    id: 7,
    title: 'ドン タン ドン タン',
    hint: 'ドン タン、ドン タン… 2つの かたちが なんども くりかえして いるよ。',
    steps: 8,
    rows: ['tan', 'don'],
    target: { tan: '.x.x.x.x', don: 'x.x.x.x.' },
    ghost: false,
    repeat: 2,
  },
  {
    id: 8,
    title: 'おなじ かたちを 2かい',
    hint: 'まえの 4つと うしろの 4つは おなじ かたち。まえを つくったら、うしろも おなじに しよう。',
    steps: 8,
    rows: ['pon', 'tan', 'don'],
    target: { pon: 'x...x...', tan: '..x...x.', don: 'x..xx..x' },
    ghost: false,
    repeat: 4,
  },
  {
    id: 9,
    title: 'くりかえしボタン',
    hint: 'ながい！ でも さいしょの 4つだけ つくれば だいじょうぶ。「×4 くりかえす」を おすと、のこりは きかいが まねして くれるよ。',
    steps: 16,
    rows: ['tan', 'don'],
    target: { tan: '..x...x...x...x.', don: 'x...x...x...x...' },
    ghost: false,
    loop: 4,
  },
  {
    id: 10,
    title: 'くりかえしで バンド',
    hint: 'さいしょの 8つを つくって「×2 くりかえす」。8つで 1しゅう、それを 2かい くりかえすよ。',
    steps: 16,
    rows: ['pon', 'chi', 'tan', 'don'],
    target: {
      pon: 'x.x...x.x.x...x.',
      chi: 'x.x.x.x.x.x.x.x.',
      tan: '..x...x...x...x.',
      don: 'x...x..xx...x..x',
    },
    ghost: false,
    loop: 8,
  },
];

export function getRhythmLevel(id: number): RhythmLevel | undefined {
  return RHYTHM_LEVELS.find((l) => l.id === id);
}
