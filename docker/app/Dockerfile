# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

# ===============================
# 0. Base Stage
# ===============================
FROM node:25-slim AS base

# パッケージインストール
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# コンテナ内の作業ディレクトリ
WORKDIR /app

# ===============================
# 1. Deps Stage
# ===============================
FROM base AS deps

# package.json と lock ファイルのコピー（キャッシュを効かせる）
COPY apps/v1/package.json apps/v1/pnpm-lock.yaml apps/v1/pnpm-workspace.yaml ./

# 依存関係インストール
RUN pnpm i --frozen-lockfile

# ===============================
# 2. Builder Stage
# ===============================
FROM base AS builder

# 依存モジュールとソースコードのコピー
COPY --from=deps /app/node_modules ./node_modules
COPY apps/v1 ./

# ビルド用環境変数
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NEXT_TELEMETRY_DISABLED 1
# ダミー用の接続文字列を環境変数に設定（これがないと prisma generate に失敗する）
ENV DATABASE_URL dummy
ENV SHADOW_DATABASE_URL dummy

# Prisma 生成 & Next.js ビルド
RUN pnpm prisma generate
RUN pnpm build

# ===============================
# 3. Runner Stage
# ===============================
FROM base AS runner

# 実行に必要な最小限のパッケージ
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    default-mysql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 非ルートユーザー作成
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 --ingroup nodejs nextjs

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# build 成果物と必要ファイルをコピー
# ※ next.config.js で output: 'standalone' を設定している前提
# ※ standalone では実行に必要なファイルのみを .next/standalone にまとめて出力する
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
# Standaloneモードの場合は node server.js で起動
CMD ["node", "server.js"]

# ===============================
# 4. Worker Stage
# ===============================
FROM base AS worker

# 実行に必要な最小限のパッケージ
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 非ルートユーザー作成
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 --ingroup nodejs nextjs

# 依存モジュールとソースコードのコピー
COPY --from=deps /app/node_modules ./node_modules
COPY apps/v1 ./

USER nextjs
CMD ["pnpm", "thumb"]

# ===============================
# 5. Migration Stage
# ===============================
FROM base AS migration

# 依存モジュールをコピー（prisma client）
COPY --from=deps /app/node_modules ./node_modules

# prisma マイグレーションに必要なファイルをコピー
COPY --from=deps /app/package.json ./
COPY apps/v1/prisma ./prisma
COPY apps/v1/prisma.config.ts ./

CMD ["pnpm", "prisma", "migrate", "deploy"]
