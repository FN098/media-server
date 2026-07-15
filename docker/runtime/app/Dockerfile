# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:25-slim AS base

# pnpm をグローバルインストール
RUN npm i -g pnpm

# ===============================
# 1. Deps Stage
# ===============================

FROM base AS deps

WORKDIR /app

# package.json と lock ファイルのコピー（キャッシュを効かせる）
COPY --chown=nextjs:nodejs pnpm-lock.yaml pnpm-workspace.yaml /app
COPY --chown=nextjs:nodejs next/package.json /app/next

# 依存関係インストール
RUN pnpm install --frozen-lockfile --filter @media-server/next

# ===============================
# 2. Builder Stage
# ===============================

FROM base AS builder

WORKDIR /app

# 依存モジュールとソースコードのコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/next/node_modules ./next/node_modules
COPY next ./next

ENV NEXT_TELEMETRY_DISABLED 1

# ダミー用の接続文字列（これがないと prisma generate に失敗する）
ENV DATABASE_URL dummy
ENV SHADOW_DATABASE_URL dummy

WORKDIR /app/next

# Prisma 生成 & Next.js ビルド
RUN pnpm prisma generate
RUN pnpm build

# ===============================
# 3. Runner Stage
# ===============================

FROM base AS runner

WORKDIR /app

# 実行に必要な最小限のパッケージ
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    default-mysql-client \
    p7zip-full \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 非ルートユーザー作成
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 --ingroup nodejs nextjs

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 成果物のコピー
# NOTE: next.config.js で output: 'standalone' を設定している前提
# NOTE: standalone では実行に必要なファイルのみを .next/standalone にまとめて出力する
COPY --from=builder /app/next/public ./next/public
COPY --from=builder --chown=nextjs:nodejs /app/next/.next/standalone ./next/
COPY --from=builder --chown=nextjs:nodejs /app/next/.next/static ./next/.next/static
# kuromoji の辞書ファイルを standalone 側の適切な位置にコピー
COPY --from=builder --chown=nextjs:nodejs /app/next/node_modules/kuromoji/dict ./next/node_modules/kuromoji/dict

USER nextjs
EXPOSE 3000

WORKDIR /app/next

# Standaloneモードの場合は node server.js で起動
CMD ["node", "server.js"]

# ===============================
# 4. Worker Stage
# ===============================

FROM base AS worker

WORKDIR /app

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
COPY next ./

USER nextjs

WORKDIR /app/next

CMD ["pnpm", "thumb"]

# ===============================
# 5. Migration Stage
# ===============================

FROM base AS migration

WORKDIR /app

# 依存モジュールをコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/next/node_modules ./next/node_modules

# マイグレーションに必要なファイルをコピー
COPY next/prisma ./next/prisma
COPY next/prisma.config.ts ./next/prisma.config.ts

WORKDIR /app/next

CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]
