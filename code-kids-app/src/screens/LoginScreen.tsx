import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { motion, useAnimationControls } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { sfx } from '../audio/sfx';
import { userForPassword, useSession } from '../store/session';

/** Long enough to read "ログインちゅう…", which is half the fun. */
const SIGN_IN_MS = 900;

export function LoginScreen() {
  const login = useSession((s) => s.login);
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const shake = useAnimationControls();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy || password.trim() === '') return;
    const user = userForPassword(password);
    if (!user) {
      setWrong(true);
      sfx.nope();
      void shake.start({ x: [0, -14, 14, -9, 9, -4, 0], transition: { duration: 0.45 } });
      return;
    }
    setWrong(false);
    setBusy(true);
    sfx.select();
    (document.activeElement as HTMLElement | null)?.blur();
    setTimeout(() => login(user), SIGN_IN_MS);
  };

  return (
    // Landscape puts the form near the top so it stays above the on-screen keyboard.
    <div className="font-system flex h-full flex-col items-center justify-center overflow-y-auto bg-[#f2f2f7] px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))] font-normal text-[#1c1c1e] landscape:justify-start landscape:pt-[max(7vh,env(safe-area-inset-top))]">
      <motion.form
        animate={shake}
        onSubmit={submit}
        className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.08)] landscape:grid landscape:max-w-3xl landscape:grid-cols-2 landscape:items-center landscape:gap-10"
      >
        <div className="text-center">
          <img src="/favicon.svg" alt="" className="mx-auto size-20 rounded-[22.5%] shadow-md roomy:size-24" />
          <h1 className="mt-4 text-3xl font-bold">コードキッズ</h1>
          <p className="mt-1 text-lg text-[#6e6e73]">パスワードを いれて ログインしてね</p>
        </div>

        <div className="mt-8 landscape:mt-0">
          <label htmlFor="password" className="block text-base font-semibold text-[#6e6e73]">
            パスワード
          </label>
          <div
            className={`mt-2 flex items-center rounded-2xl border-2 bg-[#f2f2f7] pr-2 transition-colors focus-within:border-[#007aff] focus-within:bg-white ${
              wrong ? 'border-[#ff3b30]' : 'border-transparent'
            }`}
          >
            <input
              id="password"
              type={reveal ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setWrong(false);
              }}
              disabled={busy}
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="min-w-0 flex-1 bg-transparent px-4 py-4 text-2xl font-semibold tracking-[0.2em] outline-none"
            />
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? 'パスワードを かくす' : 'パスワードを みせる'}
              className="flex size-12 items-center justify-center rounded-full text-[#8e8e93] active:bg-black/5"
            >
              {reveal ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
            </button>
          </div>
          <p className={`mt-2 h-6 text-base font-semibold text-[#ff3b30] ${wrong ? '' : 'invisible'}`} role="alert">
            パスワードが ちがうよ
          </p>

          <button
            type="submit"
            disabled={busy || password.trim() === ''}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#007aff] py-4 text-xl font-semibold text-white transition-opacity active:opacity-80 ${
              busy ? '' : 'disabled:opacity-40'
            }`}
          >
            {busy ? (
              <>
                <LoaderCircle className="size-6 animate-spin" />
                ログインちゅう…
              </>
            ) : (
              'ログイン'
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
