export type AppId = 'hoshiatsume' | 'pittari-jump' | 'mahou-art' | 'mizu-no-michi' | 'shiwake-koujou' | 'okashi-wake' | 'shikitsume-garden' | 'rhythm-machine';

export interface AppInfo {
  id: AppId;
  name: string;
  subtitle: string;
  category: string;
  /** Shown in the download sheet. The "download" is simulated, so this is for flavor only. */
  sizeMb: number;
  /**
   * `soon` apps are listed greyed out with 「もうすぐ」 so the children have something to look forward to; they cannot be downloaded yet.
   * `hidden` apps are finished but not released: they only appear on the local dev server (`npm run dev`).
   * Release them one at a time after the children clear the previous one (see ROADMAP.md).
   */
  status: 'ready' | 'soon' | 'hidden';
  /** Coins needed to buy it in the store. 0 means free. Earned by clearing stages (see store/coins.ts). */
  price: number;
  /** Background of the launch splash. */
  splash: string;
}

export const APPS: AppInfo[] = [
  {
    id: 'hoshiatsume',
    name: 'ほしあつめ',
    subtitle: 'カードで うごかす パズル',
    category: 'プログラミング',
    sizeMb: 18,
    status: 'ready',
    price: 0,
    splash: 'linear-gradient(180deg, #bde9ff 0%, #e9fbf1 100%)',
  },
  {
    id: 'pittari-jump',
    name: 'ピッタリジャンプ',
    subtitle: 'けいさんで ぴったり ジャンプ',
    category: 'さんすう',
    sizeMb: 12,
    status: 'ready',
    price: 0,
    splash: 'linear-gradient(180deg, #7be495 0%, #2fb36a 100%)',
  },
  {
    id: 'mahou-art',
    name: 'まほうのアート',
    subtitle: 'なぞると もようが ふえる',
    category: 'アート',
    sizeMb: 9,
    status: 'ready',
    price: 0,
    splash: 'radial-gradient(ellipse at 50% 0%, #3a2f86 0%, #1b1a4d 45%, #0b0b26 100%)',
  },
  {
    id: 'mizu-no-michi',
    name: 'みずのみち',
    subtitle: 'くだを つないで みずを とどける',
    category: 'プログラミング',
    sizeMb: 15,
    status: 'ready',
    price: 300,
    splash: 'linear-gradient(180deg, #bfe9ff 0%, #e8f8ff 100%)',
  },
  {
    id: 'shiwake-koujou',
    name: 'しわけこうじょう',
    subtitle: 'いろで わける きかいを つくる',
    category: 'プログラミング',
    sizeMb: 17,
    status: 'ready',
    price: 300,
    splash: 'linear-gradient(180deg, #ffe7b8 0%, #fff6e3 100%)',
  },
  {
    id: 'okashi-wake',
    name: 'おかしわけマシン',
    subtitle: 'おかしを なかよく わけよう',
    category: 'さんすう',
    sizeMb: 11,
    status: 'soon',
    price: 300,
    splash: 'linear-gradient(180deg, #ffd6e7 0%, #fff0f6 100%)',
  },
  {
    id: 'shikitsume-garden',
    name: 'しきつめガーデン',
    subtitle: 'かけざんで おはなを うえよう',
    category: 'さんすう',
    sizeMb: 13,
    status: 'soon',
    price: 300,
    splash: 'linear-gradient(180deg, #c8f0a8 0%, #f2fbe8 100%)',
  },
  {
    id: 'rhythm-machine',
    name: 'リズムマシン',
    subtitle: 'くりかえしで おんがくを つくる',
    category: 'おんがく',
    sizeMb: 14,
    status: 'soon',
    price: 300,
    splash: 'radial-gradient(ellipse at 50% 0%, #ff8fb3 0%, #7b4fd6 55%, #2d1f66 100%)',
  },
];

/** Apps shown in the store. Unreleased apps are visible only while developing. */
export const STORE_APPS: AppInfo[] = APPS.filter((a) => a.status !== 'hidden' || import.meta.env.DEV);

export function appInfo(id: AppId): AppInfo {
  return APPS.find((a) => a.id === id) ?? APPS[0];
}
