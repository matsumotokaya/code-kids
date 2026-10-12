# コードキッズ

子ども向け（6歳・8歳）のプログラミング学習ブラウザゲーム集。タブレットで遊べる PWA。
ログインすると「コードキッズ ストア」が開き、ゲームをアプリとしてダウンロードして遊ぶ。
本物のアプリを入れられない子どもたちが「ダウンロードして遊ぶ」体験をできるようにしたもので、
ログインもダウンロードも見せかけ（パスワードは2人分、進捗は端末の localStorage のみ）。

**あそぶ → https://code-kids-inky.vercel.app/**

タブレットで上記を開き、共有メニューから「ホーム画面に追加」すると、
アドレスバーのないフルスクリーンのアプリとして起動する（オフラインでも遊べる）。

## 構成

| ディレクトリ | 内容 |
|---|---|
| [`code-kids-app/`](./code-kids-app) | **本体**。Vite + React + TypeScript。Vercel でデプロイしているのはここ |
| [`おえかきロボとさんすうのあそびば/`](./おえかきロボとさんすうのあそびば) | 旧プロトタイプ（Google AI Studio / Gemini 製）。参照用に保存。「ピッタリジャンプ」は移植済み、「まほうのアート」はこれから本体へ移植する |

開発方法・あそびかた・ステージの追加手順は [`code-kids-app/README.md`](./code-kids-app/README.md) を参照。

## デプロイ

本番: https://code-kids-inky.vercel.app/ （Vercel、2026-09-05 公開）

`main` への push で自動デプロイされる。Vercel 側の設定は以下。
**Root Directory がリポジトリ直下ではない**点だけ注意（他はプリセットのまま）。

| 項目 | 値 |
|---|---|
| Framework Preset | Vite |
| Root Directory | `code-kids-app` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | 22.x |

環境変数は不要。外部 API を呼ばず、進捗は端末の localStorage にのみ保存する。

キャッシュ制御は [`code-kids-app/vercel.json`](./code-kids-app/vercel.json) にある。
Service Worker と manifest は毎回再検証、ハッシュ付きの `assets/` は永続キャッシュ。
これがないと、ホーム画面に追加済みの端末に古いビルドが残り続けて更新が届かない。
