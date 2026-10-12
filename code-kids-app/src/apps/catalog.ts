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
    subtitle: 'けいさんで ぴったり ジャンプ',
    category: 'さんすう',
    sizeMb: 12,
    status: 'ready',
    splash: 'linear-gradient(180deg, #7be495 0%, #2fb36a 100%)',
  },
  {
    id: 'mahou-art',
    name: 'まほうのアート',
    subtitle: 'なぞると もようが ふえる',
    category: 'アート',
    sizeMb: 9,
    status: 'ready',
    splash: 'radial-gradient(ellipse at 50% 0%, #3a2f86 0%, #1b1a4d 45%, #0b0b26 100%)',
  },
];

export function appInfo(id: AppId): AppInfo {
  return APPS.find((a) => a.id === id) ?? APPS[0];
}
