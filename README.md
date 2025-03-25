# 猫種推薦システム

LangChainとAnthropicのClaudeモデルを使用して、ユーザーの好みに合った猫の種類を推薦するシステム。

## セットアップ

### 必要条件
- Node.js (v16以上)
- Yarn

### インストール
```bash
# 依存関係のインストール
yarn install
```

### 環境変数の設定
`.env`ファイルをプロジェクトのルートに作成し、以下の変数を設定：
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## 使用方法
```bash
# 開発モードで実行
yarn dev

# またはビルドして実行
yarn build
yarn start
```

## 機能
- ユーザーの好みから最適な猫種を推薦
- 予算、サイズ、毛の長さ、性格などの条件に基づく検索
- 詳細な猫種情報と飼育アドバイスの提供
