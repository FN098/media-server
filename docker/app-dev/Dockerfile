# 開発用イメージ（軽量）
FROM node:25-alpine

# セキュリティのため非ルートユーザーを作成
# --system: VSCode でアタッチして開発するので不要
RUN addgroup --gid 1001 nodejs && \
  adduser --uid 1001 --ingroup nodejs -s /bin/sh -D nextjs

# Git のインストール
RUN apk add --no-cache git

# ffmpeg のインストール
RUN apk add --no-cache ffmpeg

# pnpm をグローバルインストール
RUN npm i -g pnpm

# ユーザーを root -> nextjs に切り替え
USER nextjs

# コンテナ内の作業ディレクトリ
WORKDIR /app/apps/v1

# package*.json と lock と workspace を先にコピー
COPY --chown=nextjs:nodejs apps/v1/package.json apps/v1/pnpm-lock.yaml apps/v1/pnpm-workspace.yaml ./

# 依存インストール
RUN pnpm install --frozen-lockfile

# ソース全体をコピー
COPY --chown=nextjs:nodejs . /app

# ダミー用の接続文字列を環境変数に設定（これがないと prisma generate に失敗する）
ENV DATABASE_URL dummy
ENV SHADOW_DATABASE_URL dummy

# Prisma関連
RUN pnpm prisma generate

EXPOSE 3000

# 開発モードのコマンドをデフォルトに
CMD ["pnpm", "dev"]
