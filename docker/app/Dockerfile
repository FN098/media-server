# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:25-alpine AS base

# pnpm と libc6-compat をインストール
RUN npm install -g pnpm && \
    apk add --no-cache libc6-compat

# ===============================
# 0. Deps Stage
# ===============================

FROM base AS deps

# コンテナ内の作業ディレクトリ
WORKDIR /app

# 依存関係のインストール（lockファイルを先にコピーしてキャッシュを効かせる）
COPY apps/v1/package.json apps/v1/pnpm-lock.yaml apps/v1/pnpm-workspace.yaml ./

# devDeps 含めて一度インストール
RUN pnpm i --frozen-lockfile

# ===============================
# 1. Builder Stage
# ===============================

FROM base AS builder

# コンテナ内の作業ディレクトリ
WORKDIR /app

# deps から依存パッケージをコピー
COPY --from=deps /app/node_modules ./node_modules

# ソースコードのコピー
COPY apps/v1 ./

# ダミー用の接続文字列を環境変数に設定（これがないと prisma generate に失敗する）
ENV DATABASE_URL dummy
ENV SHADOW_DATABASE_URL dummy

# Next.js のテレメトリ（Vercelへの匿名データ送信）を無効化
ENV NEXT_TELEMETRY_DISABLED 1

# Prisma クライアント生成
RUN pnpm prisma generate

# Next.js ビルド
RUN pnpm build

# ===============================
# 2. Runner Stage
# ===============================

FROM base AS runner

# コンテナ内の作業ディレクトリ
WORKDIR /app

# 念のために NODE_ENV をセット
ENV NODE_ENV production

# Next.js のテレメトリ（Vercelへの匿名データ送信）を無効化
ENV NEXT_TELEMETRY_DISABLED 1

# ffmpeg のインストール
RUN apk add --no-cache ffmpeg

# セキュリティのため非ルートユーザーを作成
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

# build 成果物と必要ファイルをコピー
# ※ next.config.js で output: 'standalone' を設定している前提
# ※ standalone では実行に必要なファイルのみを .next/standalone にまとめて出力する
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

ENV HOSTNAME="0.0.0.0"

# Standaloneモードの場合は node server.js で起動
CMD ["node", "server.js"]

# ===============================
# 3. Worker Stage
# ===============================
FROM base AS worker

# コンテナ内の作業ディレクトリ
WORKDIR /app

# ffmpeg のインストール
RUN apk add --no-cache ffmpeg

# 依存ファイルをコピー
COPY --from=deps /app/node_modules ./node_modules

# ソースコードのコピー
COPY apps/v1 ./

# サムネイル作成ワーカープロセスを起動
CMD ["pnpm", "thumb"]

# ===============================
# 4. Migration Stage
# ===============================
FROM base AS migration

# コンテナ内の作業ディレクトリ
WORKDIR /app

# 依存ファイルをコピー
COPY --from=deps /app/node_modules ./node_modules

# prisma 関連ファイルをコピー
COPY apps/v1/prisma ./prisma
# COPY apps/v1/prisma.config.ts ./ # v7 以上の場合

CMD ["pnpm", "prisma", "migrate", "deploy"]
