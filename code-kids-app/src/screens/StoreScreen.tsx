import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { AppIcon } from '../apps/AppIcon';
import { STORE_APPS, type AppId, type AppInfo } from '../apps/catalog';
import { useCoinBalance } from '../apps/wallet';
import { sfx } from '../audio/sfx';
import { CoinIcon } from '../components/Coin';
import { Avatar } from '../components/ui/AccountBadge';
import { COINS_BY_STARS } from '../store/coins';
import { userMeta, useSession, type UserId } from '../store/session';

type TileState = 'soon' | 'buy' | 'get' | 'downloading' | 'installed';

type Dialog = { kind: 'get' | 'buy' | 'delete' | 'soon'; app: AppInfo } | { kind: 'account' | 'coins' };

const NONE: AppId[] = [];
const LONG_PRESS_MS = 600;
const WEEKDAYS = ['にちようび', 'げつようび', 'かようび', 'すいようび', 'もくようび', 'きんようび', 'どようび'];

function todayLabel(d = new Date()): string {
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS[d.getDay()]}`;
}

interface Props {
  user: UserId;
  onOpen: (app: AppId) => void;
}

export function StoreScreen({ user, onOpen }: Props) {
  const meta = userMeta(user);
  const installed = useSession((s) => s.installed[user]) ?? NONE;
  const downloads = useSession((s) => s.downloads);
  const startDownload = useSession((s) => s.startDownload);
  const uninstall = useSession((s) => s.uninstall);
  const purchases = useSession((s) => s.purchases[user]);
  const buy = useSession((s) => s.buy);
  const coins = useCoinBalance(user);
  const logout = useSession((s) => s.logout);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [justInstalled, setJustInstalled] = useState<AppId | null>(null);

  const stateOf = (app: AppInfo): TileState => {
    if (app.status === 'soon') return 'soon';
    if (downloads[app.id] !== undefined) return 'downloading';
    if (installed.includes(app.id)) return 'installed';
    return app.price > 0 && purchases?.[app.id] === undefined ? 'buy' : 'get';
  };

  const tap = (app: AppInfo) => {
    const state = stateOf(app);
    if (state === 'downloading') return;
    if (state === 'installed') {
      sfx.select();
      onOpen(app.id);
      return;
    }
    sfx.tap();
    setDialog({ kind: state, app });
  };

  const download = (app: AppInfo) => {
    setDialog(null);
    sfx.select();
    startDownload(app.id, () => {
      sfx.unlock();
      setJustInstalled(app.id);
    });
  };

  const purchase = (app: AppInfo) => {
    if (coins < app.price) return;
    buy(app.id, app.price);
    sfx.coin();
    download(app);
  };

  const close = () => setDialog(null);

  return (
    <div className="font-system h-full overflow-y-auto bg-white font-normal text-[#1c1c1e]">
      <header className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:px-6 sm:pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="text-base font-semibold text-[#8e8e93]">{todayLabel()}</p>
          <h1 className="break-keep text-3xl font-bold tracking-tight sm:text-4xl">コードキッズ ストア</h1>
        </div>
        {/* On phones the buttons take their own row above the title so the title keeps the full width. */}
        <div className="order-first flex shrink-0 items-center justify-end gap-3 sm:order-none">
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setDialog({ kind: 'coins' });
            }}
            aria-label={`コイン ${coins}こ`}
            className="flex items-center gap-1.5 rounded-full bg-[#fff6d6] py-1.5 pl-1.5 pr-4 active:bg-[#ffedb0]"
          >
            <CoinIcon size={40} />
            <span className="text-xl font-bold tabular-nums">{coins}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              setDialog({ kind: 'account' });
            }}
            aria-label={`${meta.name}の アカウント`}
            className="flex items-center gap-2 rounded-full bg-[#f2f2f7] py-1.5 pl-1.5 pr-4 active:bg-[#e5e5ea]"
          >
            <Avatar user={user} className="size-10 text-lg" />
            <span className="text-lg font-semibold">{meta.name}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
        <div className="border-t border-black/10 pt-6">
          <h2 className="text-2xl font-bold">プログラミングの ゲーム</h2>
          <p className="mt-1 break-keep text-lg text-[#6e6e73]">ステージを クリアすると コインが もらえるよ。コインで あたらしい ゲームが かえるよ</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] sm:gap-x-4 sm:gap-y-10 roomy:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] roomy:gap-x-6">
          {STORE_APPS.map((app) => {
            const state = stateOf(app);
            return (
              <AppTile
                key={app.id}
                app={app}
                state={state}
                progress={downloads[app.id] ?? 0}
                celebrate={justInstalled === app.id}
                onTap={() => tap(app)}
                onLongPress={
                  state === 'installed'
                    ? () => {
                        sfx.power();
                        setDialog({ kind: 'delete', app });
                      }
                    : undefined
                }
              />
            );
          })}
        </div>

        <p className="mt-14 text-center text-base text-[#8e8e93]">アプリを ながおしすると けせるよ</p>
      </main>

      <AnimatePresence>
        {dialog && (
          <Sheet key={'app' in dialog ? `${dialog.kind}-${dialog.app.id}` : dialog.kind} onClose={close}>
            {dialog.kind === 'get' && (
              <>
                <AppIcon id={dialog.app.id} className="mx-auto size-24" />
                <h2 className="mt-4 text-2xl font-bold">{dialog.app.name}</h2>
                <p className="text-base text-[#8e8e93]">{dialog.app.category}</p>
                <p className="mt-5 text-xl font-semibold">ダウンロードしますか？</p>
                <dl className="mt-4 grid grid-cols-3 rounded-2xl bg-[#f2f2f7] py-3">
                  <Fact label="サイズ" value={`${dialog.app.sizeMb} MB`} />
                  <Fact label="ねんれい" value="6さい〜" />
                  <Fact label="ねだん" value={dialog.app.price > 0 ? 'かいずみ' : 'むりょう'} />
                </dl>
                <SheetButtons>
                  <SheetButton onClick={close}>やめる</SheetButton>
                  <SheetButton tone="primary" onClick={() => download(dialog.app)}>
                    ダウンロード
                  </SheetButton>
                </SheetButtons>
              </>
            )}
            {dialog.kind === 'buy' && (
              <>
                <AppIcon id={dialog.app.id} className="mx-auto size-24" />
                <h2 className="mt-4 text-2xl font-bold">{dialog.app.name}</h2>
                <p className="text-base text-[#8e8e93]">{dialog.app.category}</p>
                {coins >= dialog.app.price ? (
                  <p className="mt-5 text-xl font-semibold">コインで かいますか？</p>
                ) : (
                  <p className="mt-5 text-xl font-semibold">
                    あと <span className="text-[#ff9500]">{dialog.app.price - coins}コイン</span> たりないよ
                  </p>
                )}
                <dl className="mt-4 grid grid-cols-2 rounded-2xl bg-[#f2f2f7] py-3">
                  <Fact label="ねだん" value={<CoinAmount n={dialog.app.price} />} />
                  <Fact label="もっている" value={<CoinAmount n={coins} />} />
                </dl>
                {coins >= dialog.app.price ? (
                  <SheetButtons>
                    <SheetButton onClick={close}>やめる</SheetButton>
                    <SheetButton tone="primary" onClick={() => purchase(dialog.app)}>
                      かう
                    </SheetButton>
                  </SheetButtons>
                ) : (
                  <>
                    <p className="mt-4 text-lg text-[#6e6e73]">ゲームで ステージを クリアして コインを ためよう！</p>
                    <SheetButtons>
                      <SheetButton tone="primary" onClick={close}>
                        OK
                      </SheetButton>
                    </SheetButtons>
                  </>
                )}
              </>
            )}
            {dialog.kind === 'coins' && (
              <>
                <CoinIcon size={96} className="mx-auto" />
                <h2 className="mt-3 text-3xl font-bold tabular-nums">{coins} コイン</h2>
                <p className="mt-3 text-lg text-[#6e6e73]">ステージを はじめて クリアすると もらえるよ。ほしが ふえると もっと もらえるよ。</p>
                <dl className="mt-4 grid grid-cols-3 rounded-2xl bg-[#f2f2f7] py-3">
                  {([1, 2, 3] as const).map((n) => (
                    <Fact key={n} label={'★'.repeat(n)} value={<CoinAmount n={COINS_BY_STARS[n]} />} />
                  ))}
                </dl>
                <SheetButtons>
                  <SheetButton tone="primary" onClick={close}>
                    OK
                  </SheetButton>
                </SheetButtons>
              </>
            )}
            {dialog.kind === 'delete' && (
              <>
                <AppIcon id={dialog.app.id} className="anim-jiggle mx-auto size-24" />
                <h2 className="mt-4 text-2xl font-bold">「{dialog.app.name}」を けしますか？</h2>
                <p className="mt-2 text-lg text-[#6e6e73]">★の きろくは のこるよ。また ダウンロードすれば つづきから あそべるよ。</p>
                <SheetButtons>
                  <SheetButton onClick={close}>やめる</SheetButton>
                  <SheetButton
                    tone="danger"
                    onClick={() => {
                      uninstall(dialog.app.id);
                      sfx.tap();
                      close();
                    }}
                  >
                    けす
                  </SheetButton>
                </SheetButtons>
              </>
            )}
            {dialog.kind === 'soon' && (
              <>
                <AppIcon id={dialog.app.id} className="mx-auto size-24 opacity-60 grayscale" />
                <h2 className="mt-4 text-2xl font-bold">{dialog.app.name}</h2>
                <p className="mt-2 text-lg text-[#6e6e73]">もうすぐ とどくよ！ たのしみに まっててね。</p>
                {dialog.app.price > 0 && (
                  <p className="mt-3 text-lg">
                    <span className="font-semibold">{dialog.app.price}コイン</span> で かえるよ。いまは <span className="font-semibold">{coins}コイン</span>
                  </p>
                )}
                <SheetButtons>
                  <SheetButton tone="primary" onClick={close}>
                    OK
                  </SheetButton>
                </SheetButtons>
              </>
            )}
            {dialog.kind === 'account' && (
              <>
                <Avatar user={user} className="mx-auto size-24 text-5xl" />
                <h2 className="mt-4 text-2xl font-bold">{meta.name}</h2>
                <p className="text-base text-[#8e8e93]">ログインちゅう</p>
                <SheetButtons>
                  <SheetButton onClick={close}>とじる</SheetButton>
                  <SheetButton
                    tone="danger"
                    onClick={() => {
                      sfx.tap();
                      logout();
                    }}
                  >
                    ログアウト
                  </SheetButton>
                </SheetButtons>
              </>
            )}
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TileProps {
  app: AppInfo;
  state: TileState;
  progress: number;
  celebrate: boolean;
  onTap: () => void;
  onLongPress?: () => void;
}

function AppTile({ app, state, progress, celebrate, onTap, onLongPress }: TileProps) {
  const press = useLongPress(onLongPress);
  const percent = Math.floor(progress);

  return (
    <div className="flex h-full flex-col items-center text-center">
      <motion.button
        type="button"
        {...press.handlers}
        onClick={() => {
          if (press.consumeLongPress()) return;
          onTap();
        }}
        animate={celebrate ? { scale: [1, 1.14, 0.96, 1] } : undefined}
        transition={{ duration: 0.5 }}
        aria-label={app.name}
        className="relative transition-transform duration-150 active:scale-95"
      >
        <AppIcon id={app.id} className={`size-28 sm:size-32 roomy:size-40 ${state === 'soon' ? 'opacity-60 grayscale' : ''}`} />
        {state === 'downloading' && <DownloadOverlay percent={percent} />}
      </motion.button>
      <div className="mt-3 text-lg font-semibold leading-tight sm:text-xl">{app.name}</div>
      <div className="mt-1 break-keep text-sm leading-snug text-[#8e8e93] sm:text-base">{app.subtitle}</div>
      {/* Pinned to the bottom so buttons line up across a row even when subtitles wrap differently. */}
      <div className="mt-auto pt-3">
        {state === 'get' && <Pill onClick={onTap}>入手</Pill>}
        {state === 'buy' && (
          <Pill onClick={onTap}>
            <CoinAmount n={app.price} />
          </Pill>
        )}
        {state === 'installed' && <Pill onClick={onTap}>ひらく</Pill>}
        {state === 'soon' && <span className="inline-block rounded-full bg-[#f2f2f7] px-5 py-2 text-base font-semibold text-[#8e8e93]">もうすぐ</span>}
        {state === 'downloading' && (
          <div className="relative flex h-11 w-28 items-center justify-center overflow-hidden rounded-full bg-[#eef0f5]" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="absolute inset-y-0 left-0 bg-[#007aff]/20" style={{ width: `${progress}%` }} />
            <span className="relative text-lg font-bold tabular-nums text-[#007aff]">{percent}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

const RING_R = 26;
const RING_C = 2 * Math.PI * RING_R;

function DownloadOverlay({ percent }: { percent: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-[22.5%] bg-black/45">
      <svg viewBox="0 0 64 64" className="size-20" aria-hidden>
        <circle cx={32} cy={32} r={RING_R} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={5} />
        <circle
          cx={32}
          cy={32}
          r={RING_R}
          fill="none"
          stroke="#ffffff"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - percent / 100)}
          transform="rotate(-90 32 32)"
        />
        <text x={32} y={37} textAnchor="middle" fontSize={15} fontWeight={700} fill="#ffffff">
          {percent}
        </text>
      </svg>
    </div>
  );
}

function Pill({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="min-w-28 rounded-full bg-[#eef0f5] px-6 py-2 text-lg font-bold text-[#007aff] active:bg-[#dfe3ea]">
      {children}
    </button>
  );
}

function CoinAmount({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center gap-1 tabular-nums">
      <CoinIcon size={22} />
      {n}
    </span>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-black/10 [&:not(:first-child)]:border-l">
      <dt className="text-sm text-[#8e8e93]">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}

function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  // After a long press the finger is still down when the sheet appears, and lifting it
  // produces a click on the backdrop. Only close for presses that began on the backdrop.
  const pressedBackdrop = useRef(false);
  // A closing sheet must not swallow the next tap while it fades out.
  const present = useIsPresent();
  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6 ${present ? '' : 'pointer-events-none'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedBackdrop.current) onClose();
        pressedBackdrop.current = false;
      }}
    >
      <motion.div
        role="dialog"
        aria-modal
        className="w-full max-w-sm break-keep rounded-[28px] bg-white p-7 text-center shadow-2xl"
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.15 } }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function SheetButtons({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex gap-3">{children}</div>;
}

function SheetButton({ tone = 'plain', onClick, children }: { tone?: 'plain' | 'primary' | 'danger'; onClick: () => void; children: ReactNode }) {
  const tones = {
    plain: 'bg-[#f2f2f7] text-[#007aff] active:bg-[#e5e5ea]',
    primary: 'bg-[#007aff] text-white active:opacity-80',
    danger: 'bg-[#ff3b30] text-white active:opacity-80',
  };
  return (
    <button type="button" onClick={onClick} className={`flex-1 rounded-2xl py-3.5 text-lg font-semibold ${tones[tone]}`}>
      {children}
    </button>
  );
}

/** Long press like a real home screen; the click that follows the release is swallowed. */
function useLongPress(onLongPress: (() => void) | undefined) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const cancel = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  };

  useEffect(() => cancel, []);

  return {
    handlers: {
      onPointerDown: () => {
        fired.current = false;
        cancel();
        if (!onLongPress) return;
        timer.current = window.setTimeout(() => {
          fired.current = true;
          onLongPress();
        }, LONG_PRESS_MS);
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
    },
    consumeLongPress: () => {
      const wasLong = fired.current;
      fired.current = false;
      return wasLong;
    },
  };
}
