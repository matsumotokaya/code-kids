# コードキッズ（code-kids-app）

子ども向け（6歳・8歳）のプログラミング学習ブラウザゲーム。
カードを並べてキャラクターを動かし、おほしさまを集める「ほしあつめ」パズル。
旧アプリ「おえかきロボとさんすうのあそびば」の「おえかきロボット」をゼロベースで作り直したもの。

## あそびかた

1. タイトルでキャラクター（ロボ / ネコ / ウサギ）を選ぶ。キャラごとに進捗が保存されるので、兄妹で別のキャラを使えばそれぞれの記録になる
2. マップでステージを選ぶ（前のステージをクリアすると次が開く）
3. カード（うえ / した / ひだり / みぎ）をタップして並べ、「うごけ！」で実行
4. 「2かい」「3かい」カードは直前のカードに掛かり、そのカード1枚で 2 / 3 マス進む（かけ算・くり返しの導入）
5. いわ・ばんの外にぶつかる、みずに落ちる、ほしが残る、と失敗。カードは消えないので直してもう一度
6. 少ないカード枚数でクリアすると ★3（各ステージの `par` が基準）

## 技術スタック

- Vite 7 / React 19 / TypeScript
- Tailwind CSS v4、motion（アニメーション）、zustand（進捗の localStorage 永続化）
- vite-plugin-pwa（ホーム画面追加・オフライン動作）
- 効果音は Web Audio API で合成（音声ファイルなし）
- タイル・キャラクターはすべてインライン SVG（端末による絵文字の差異を避ける）

## 開発

```bash
npm install
npm run dev        # http://localhost:5173 （--host 付きなので同一Wi-Fiのタブレットから <MacのIP>:5173 で開ける）
npm test           # ゲームエンジンと全ステージの検証（BFS で最短手数 = par を確認）
npm run build      # 型チェック + 本番ビルド → dist/
npm run preview    # dist/ を配信
```

## ディレクトリ

```
src/
  game/        ロジック（UI非依存・テスト対象）
    types.ts     型
    levels.ts    ステージ定義（座標は x=右, y=下）
    engine.ts    simulate(): プログラムを実行してイベント列を返す
    solver.ts    minCommands(): BFS で最短カード枚数
  store/       進捗（キャラ別）・サウンド設定
  audio/       効果音シンセ
  components/  Board（SVGの島）、Character（3キャラのSVG）、tiles、CommandCard、ProgramStrip など
  screens/     Title / Map / Play
```

## ステージを追加する

`src/game/levels.ts` に要素を追加し、`npm test` を実行する。
解けない・`par` が最短と一致しない場合はテストが落ちて正しい値を教えてくれる。

## デプロイ

静的サイトなので `dist/` をそのまま配信すればよい（Vercel / Netlify / Cloudflare Pages / GitHub Pages など）。
PWA はサブパス配信に対応していないので、独自ドメインまたはルート配信を推奨。
