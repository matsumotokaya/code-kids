import { useCoinBalance } from '../../apps/wallet';
import { userMeta, type UserId } from '../../store/session';
import { CoinIcon } from '../Coin';

export function Avatar({ user, className = '' }: { user: UserId; className?: string }) {
  const meta = userMeta(user);
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`} style={{ backgroundColor: meta.color }} aria-hidden>
      {meta.name[0]}
    </span>
  );
}

/**
 * Who is playing and how many coins they have, kept at the right end of every game header.
 * Phones have no room for a pill next to the other buttons, so the coins sit on the avatar like a badge.
 */
export function AccountBadge({ user }: { user: UserId }) {
  const coins = useCoinBalance(user);
  const label = `${userMeta(user).name}・コイン ${coins}こ`;
  return (
    <>
      <div className="relative shrink-0 sm:hidden" role="img" aria-label={label}>
        <Avatar user={user} className="size-12 border-[3px] border-white text-xl shadow-md" />
        <span className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-white py-0.5 pl-0.5 pr-1.5 text-sm tabular-nums leading-none shadow">
          <CoinIcon size={16} />
          {coins}
        </span>
      </div>
      <div className="hidden h-14 shrink-0 items-center gap-2 rounded-full bg-white/90 pl-2 pr-4 shadow-md sm:flex" role="img" aria-label={label}>
        <Avatar user={user} className="size-10 text-lg" />
        <CoinIcon size={30} />
        <span className="text-xl tabular-nums">{coins}</span>
      </div>
    </>
  );
}
