# コードキッズ

子ども向け（6歳・8歳）のプログラミング学習ブラウザゲーム集。
カードを並べてキャラクターを動かす、タブレットで遊べる PWA。

## 構成

| ディレクトリ | 内容 |
|---|---|
| [`code-kids-app/`](./code-kids-app) | **本体**。Vite + React + TypeScript。Vercel でデプロイしているのはここ |
| [`おえかきロボとさんすうのあそびば/`](./おえかきロボとさんすうのあそびば) | 旧プロトタイプ（Google AI Studio / Gemini 製）。参照用に保存。今後ここの「ピッタリジャンプ」「まほうのアート」を本体へ移植する |

開発方法・あそびかた・ステージの追加手順は [`code-kids-app/README.md`](./code-kids-app/README.md) を参照。

## デプロイ

Vercel。**Root Directory を `code-kids-app` に設定する**（リポジトリ直下ではない）。
`main` への push で本番へ自動デプロイされる。
