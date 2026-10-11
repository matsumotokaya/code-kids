export type AppId = 'hoshiatsume' | 'pittari-jump' | 'mahou-art';

export interface AppInfo {
  id: AppId;
  name: string;
  subtitle: string;
  category: string;
  /** Shown in the download sheet. The "download" is simulated, so this is for flavor only. */
  sizeMb: number;
  /** `soon` apps are listed in the store but cannot be downloaded yet. */
  status: 'ready' | 'soon';
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
    splash: 'linear-gradient(180deg, #bde9ff 0%, #e9fbf1 100%)',
  },
  {
    id: 'pittari-jump',
    name: 'ピッタリジャンプ',
    subtitle: 'たしざんで ぴったり ジャンプ',
    category: 'さんすう',
    sizeMb: 12,
    status: 'soon',
    splash: 'linear-gradient(180deg, #7be495 0%, #2fb36a 100%)',
  },
  {
    id: 'mahou-art',
    name: 'まほうのアート',
    subtitle: 'かけざんで もようを かこう',
    category: 'アート',
    sizeMb: 9,
    status: 'soon',
    splash: 'linear-gradient(160deg, #6d4bd8 0%, #e14fad 100%)',
  },
];

export function appInfo(id: AppId): AppInfo {
  return APPS.find((a) => a.id === id) ?? APPS[0];
}
