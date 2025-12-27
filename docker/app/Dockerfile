# ===============================
# 0. Base Stage
# ===============================
FROM node:25-alpine AS base

# コンテナ内の作業ディレクトリ
WORKDIR /app

# pnpm をグローバルインストール
RUN npm install -g pnpm

# ===============================
# 1. Builder Stage
# ===============================
FROM base AS builder

# package.json と lockfile と workspace をコピー
COPY apps/v1/package.json apps/v1/pnpm-lock.yaml apps/v1/pnpm-workspace.yaml .

# devDeps 含めて一度インストール
RUN pnpm install --frozen-lockfile

# プロジェクトファイルをコピー
COPY apps/v1 .

ENV DATABASE_URL dummy
ENV SHADOW_DATABASE_URL dummy

# Prisma クライアント生成
RUN pnpm prisma generate

# Next.js ビルド
RUN pnpm build

# ===============================
# 2. Runner Stage
# ===============================
FROM base AS runner

# ffmpeg のインストール
RUN apk add --no-cache ffmpeg

# package.json と lockfile と workspace をコピー
COPY apps/v1/package.json apps/v1/pnpm-lock.yaml apps/v1/pnpm-workspace.yaml .

# builder から node_modules をコピー
COPY --from=builder /app/node_modules ./node_modules

# devDeps を削除して production のみ残す
RUN pnpm prune --prod

# build 成果物と必要ファイルをコピー
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/generated ./generated

EXPOSE 3000

CMD ["pnpm", "start"]

# ===============================
# 3. Worker Stage
# ===============================

FROM base AS worker

# ffmpeg のインストール
RUN apk add --no-cache ffmpeg

# package.json と lockfile と workspace をコピー
COPY apps/v1/package.json apps/v1/pnpm-lock.yaml apps/v1/pnpm-workspace.yaml .

# builder から node_modules をコピー
COPY --from=builder /app/node_modules ./node_modules

# プロジェクトファイルをコピー
COPY apps/v1 .

EXPOSE 3000

CMD ["pnpm", "thumb-ps"]
