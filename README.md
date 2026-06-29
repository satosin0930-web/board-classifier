# 基盤判定アプリ - Board Classifier

スマートな段階的判定で K-Y System の基盤を自動分類するアプリです。

## 機能

- 📸 スマートフォンカメラで撮影
- 🤖 Claude AI による自動判定
- 📊 信頼度に基づいた段階的判定
- 💾 判定結果の保存
- 🌍 スマートフォン対応

## デプロイ方法

### 1. GitHub に push

```bash
git clone <this-repo>
cd board-classifier
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/board-classifier.git
git push -u origin main
```

### 2. Vercel にデプロイ

1. [Vercel](https://vercel.com) にアクセス
2. GitHub アカウントでログイン
3.「New Project」をクリック
4. このリポジトリを選択
5. 環境変数を設定：
   - キー: `ANTHROPIC_API_KEY`
   - 値: [Anthropic Console](https://console.anthropic.com/account/keys) から取得した API キー
6. 「Deploy」をクリック

### 3. 完成

デプロイ完了後、Vercel が提供するURL（例：`https://board-classifier-satosin.vercel.app`）でアクセス可能。

## 使い方

1. スマートフォンで URL を開く
2. 基盤を撮影（「撮影」ボタン）
3. Claude AI が自動判定
4. 信頼度が低い場合は、別角度の追加画像をお願い
5. 複数画像で再分析して精度向上

## 技術スタック

- Next.js 14
- React 18
- Anthropic Claude API
- Vercel

## 環境変数

`.env.local` に以下を設定してください：

```
ANTHROPIC_API_KEY=sk-ant-xxx
```

## 開発

```bash
npm install
npm run dev
```

http://localhost:3000 で開発サーバーが起動。

## ライセンス

MIT
