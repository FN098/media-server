# 開発用イメージ（軽量）
FROM node:20-alpine

WORKDIR /app

# Git のインストール
RUN apk add --no-cache git

# pnpm をグローバルインストール（pnpm を使う想定）
RUN npm i -g pnpm

# package*.json と lock を先にコピーして依存だけ先にインストール（キャッシュ活用）
COPY apps/v1/package.json apps/v1/pnpm-lock.yaml ./apps/v1/

# 依存インストール
RUN pnpm install --frozen-lockfile || pnpm install

# ソース全体をコピー
COPY . .

# Prisma関連
RUN pnpm prisma generate || true

EXPOSE 3000

# 開発モードのコマンドをデフォルトに
CMD ["pnpm", "dev"]
