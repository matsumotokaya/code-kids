import { coinBalance, profileCoins } from '../store/coins';
import { useProgress } from '../store/progress';
import { useSession, type UserId } from '../store/session';
import { useMizuProgress } from './mizu-no-michi/progress';
import { useOkashiProgress } from './okashi-wake/progress';
import { useJumpProgress } from './pittari-jump/progress';
import { useShikitsumeProgress } from './shikitsume-garden/progress';
import { useShiwakeProgress } from './shiwake-koujou/progress';

/**
 * Coins earned in every game with stages. Each Hoshiatsume character keeps its own record,
 * so clearing a stage again with another character pays again: that is a real replay, not farming.
 * A new game with stages adds its own line here.
 */
export function useEarnedCoins(user: UserId): number {
  const hoshiatsume = useProgress((s) => {
    const profiles = s.users[user]?.profiles;
    return profiles ? profileCoins(profiles.robo) + profileCoins(profiles.neko) + profileCoins(profiles.usagi) : 0;
  });
  const pittariJump = useJumpProgress((s) => profileCoins(s.users[user]));
  const mizuNoMichi = useMizuProgress((s) => profileCoins(s.users[user]));
  const shiwakeKoujou = useShiwakeProgress((s) => profileCoins(s.users[user]));
  const okashiWake = useOkashiProgress((s) => profileCoins(s.users[user]));
  const shikitsumeGarden = useShikitsumeProgress((s) => profileCoins(s.users[user]));
  return hoshiatsume + pittariJump + mizuNoMichi + shiwakeKoujou + okashiWake + shikitsumeGarden;
}

export function useCoinBalance(user: UserId): number {
  const earned = useEarnedCoins(user);
  const purchases = useSession((s) => s.purchases[user]);
  return coinBalance(earned, purchases);
}
