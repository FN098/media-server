# 開発用イメージ（軽量）
FROM node:25-alpine

# コンテナ内の作業ディレクトリ
WORKDIR /app/apps/v1

# Git のインストール
RUN apk add --no-cache git

# ffmpeg のインストール
RUN apk add --no-cache ffmpeg

# pnpm をグローバルインストール
RUN npm i -g pnpm

# package*.json と lock を先にコピー
COPY apps/v1/package.json apps/v1/pnpm-lock.yaml ./

# 依存インストール
RUN pnpm install --frozen-lockfile || pnpm install

# ソース全体をコピー
COPY . /app

# Prisma関連
RUN pnpm prisma generate || true

EXPOSE 3000

# 開発モードのコマンドをデフォルトに
CMD ["pnpm", "dev"]
