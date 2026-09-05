import { RoboLevel, JumpLevel } from '../types';

export const ROBO_LEVELS: RoboLevel[] = [
  {
    id: 1,
    title: '★ レベル1：はじめの いっぽ',
    hint: 'ロボットを「みぎへ ＋1」に 2うごかして、おほしさま ✨ に タッチしよう！',
    startX: 0,
    startY: 2,
    targetX: 2,
    targetY: 2,
    gridSize: 5,
    maxCommands: 4,
    availableCommands: ['RIGHT'],
    cells: [
      { x: 0, y: 2, type: 'start', label: '🤖' },
      { x: 2, y: 2, type: 'star', label: '✨' }
    ]
  },
  {
    id: 2,
    title: '★ レベル2：みずたまりを さけよう！',
    hint: 'あおい「みずたまり 💧」にあたらないように、うえを通って おほしさまを つかまえよう！',
    startX: 0,
    startY: 3,
    targetX: 2,
    targetY: 1,
    gridSize: 5,
    maxCommands: 4,
    availableCommands: ['UP', 'RIGHT', 'DOWN'],
    cells: [
      { x: 0, y: 3, type: 'start', label: '🤖' },
      { x: 1, y: 3, type: 'puddle', label: '💧' },
      { x: 2, y: 1, type: 'star', label: '✨' }
    ]
  },
  {
    id: 3,
    title: '★ レベル3：びょーん！＋2マスジャンプ',
    hint: '「みぎへ ＋2」の まほうカードをつかうと、いっきに ２マス すすむよ！たしてみよう！',
    startX: 0,
    startY: 2,
    targetX: 3,
    targetY: 2,
    gridSize: 5,
    maxCommands: 3,
    availableCommands: ['RIGHT', 'DOUBLE', 'UP'], // DOUBLE will be rendered as "みぎへ ＋2" or double jump
    cells: [
      { x: 0, y: 2, type: 'start', label: '🤖' },
      { x: 1, y: 2, type: 'obstacle', label: '🧱' },
      { x: 3, y: 2, type: 'star', label: '✨' }
    ]
  },
  {
    id: 4,
    title: '★ レベル4：ひき算で もどる！-1 のちから',
    hint: 'すすみすぎたら「ひだりへ -1」で もどろう！ドロドロぬまを 回避するよ！',
    startX: 0,
    startY: 1,
    targetX: 1,
    targetY: 1,
    gridSize: 5,
    maxCommands: 4,
    availableCommands: ['RIGHT', 'LEFT', 'DOWN'],
    cells: [
      { x: 0, y: 1, type: 'start', label: '🤖' },
      { x: 2, y: 1, type: 'obstacle', label: '🧱' },
      { x: 1, y: 1, type: 'star', label: '✨' }
    ]
  },
  {
    id: 5,
    title: '★ レベル5：３ばい！かけざんブースター',
    hint: '「３ばい 🚀」カード！みぎに1進んだあと、３ばいカードを使うといっきに「1 × 3 ＝ 3」マス進めるよ！',
    startX: 0,
    startY: 2,
    targetX: 3,
    targetY: 2,
    gridSize: 5,
    maxCommands: 2,
    availableCommands: ['RIGHT', 'TRIPLE'], // TRIPLE means jump 3 blocks or multiply
    cells: [
      { x: 0, y: 2, type: 'start', label: '🤖' },
      { x: 1, y: 2, type: 'puddle', label: '💧' },
      { x: 2, y: 2, type: 'puddle', label: '💧' },
      { x: 3, y: 2, type: 'star', label: '✨' }
    ]
  }
];

export const JUMP_LEVELS: JumpLevel[] = [
  {
    id: 1,
    startValue: 2,
    targetValue: 6,
    maxMoves: 3,
    allowedActions: [
      { label: 'たす 2 (＋2)', operation: 'add', value: 2 },
      { label: 'たす 1 (＋1)', operation: 'add', value: 1 }
    ],
    hint: '「2」からはじまるよ！「たす 2」をなんかい おしたら、「6」に ピッタリつけるかな？'
  },
  {
    id: 2,
    startValue: 3,
    targetValue: 8,
    maxMoves: 3,
    allowedActions: [
      { label: 'たす 3 (＋3)', operation: 'add', value: 3 },
      { label: 'ひく 1 (－1)', operation: 'sub', value: 1 }
    ],
    hint: '「3」からはじまるよ！「たす 3」をしてから「ひく 1」をするとどうなるかな？'
  },
  {
    id: 3,
    startValue: 2,
    targetValue: 10,
    maxMoves: 3,
    allowedActions: [
      { label: 'かける 2 (×2)', operation: 'mul', value: 2 },
      { label: 'たす 3 (＋3)', operation: 'add', value: 3 }
    ],
    hint: 'かけざんは２倍（２つぶん）になるよ！「2」に「たす 3」をしてから「かける 2」をしてみよう！'
  },
  {
    id: 4,
    startValue: 12,
    targetValue: 4,
    maxMoves: 3,
    allowedActions: [
      { label: 'わる 3 (÷3)', operation: 'div', value: 3 },
      { label: 'ひく 2 (－2)', operation: 'sub', value: 2 }
    ],
    hint: 'わりざんははんぶんや３つにわけること！「12 わる 3」は いくつになるかな？'
  },
  {
    id: 5,
    startValue: 1,
    targetValue: 15,
    maxMoves: 4,
    allowedActions: [
      { label: 'かける 3 (×3)', operation: 'mul', value: 3 },
      { label: 'たす 2 (＋2)', operation: 'add', value: 2 },
      { label: 'ひく 1 (－1)', operation: 'sub', value: 1 }
    ],
    hint: 'さいしゅうもんだい！「1」から「15」まで、かけざんとたしざんを くみあわせて ぴったりジャンプ！'
  }
];
