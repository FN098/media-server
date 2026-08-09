# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

FROM node:25-slim AS base

# pnpm をグローバルインストール
FROM base AS base-pnpm
RUN npm install -g pnpm

# ===============================
# 1. Deps Stage
# ===============================

FROM base-pnpm AS deps

WORKDIR /app

# package.json と lock ファイルのコピー（キャッシュを効かせる）
COPY --chown=nextjs:nodejs pnpm-lock.yaml pnpm-workspace.yaml ./

# next パッケージ
COPY --chown=nextjs:nodejs next/package.json ./next/

# 依存関係インストール
RUN pnpm install --frozen-lockfile --filter @media-server/next

# ===============================
# 2. Builder Stage
# ===============================

FROM base-pnpm AS builder

WORKDIR /app/next

# deps の内容をコピー
COPY --from=deps /app /app

# アプリケーションをコピー
COPY next ./

ENV NEXT_TELEMETRY_DISABLED=1

# ダミー用の接続文字列（これがないと prisma generate に失敗する）
ARG DATABASE_URL="mysql://user:pass@db:3306/dummy"
ARG SHADOW_DATABASE_URL="mysql://user:pass@db:3306/dummy"

# Prisma Client 生成
RUN pnpm prisma generate

# Next.js ビルド
RUN pnpm build

# ===============================
# 3. Runner Stage
# ===============================

FROM base AS runner

# 実行に必要な最小限のパッケージ
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    default-mysql-client \
    p7zip-full \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/next

# 念のために NODE_ENV をセット
ENV NODE_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1

# 非ルートユーザー作成
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 --ingroup nodejs nextjs

# 成果物のコピー
# NOTE: next.config.js で output: 'standalone' を設定している前提
# NOTE: standalone では実行に必要なファイルのみを .next/standalone にまとめて出力する
COPY --from=builder /app/next/public /app/next/public
COPY --from=builder --chown=nextjs:nodejs /app/next/.next/standalone /app
COPY --from=builder --chown=nextjs:nodejs /app/next/.next/static /app/next/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/next/node_modules/kuromoji/dict /app/next/node_modules/kuromoji/dict

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Standaloneモードの場合は node server.js で起動
CMD ["node", "server.js"]

# ===============================
# 4. Worker Stage
# ===============================

FROM base-pnpm AS worker

WORKDIR /app/next

# 実行に必要な最小限のパッケージ
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 非ルートユーザー作成
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 --ingroup nodejs nextjs

# 依存モジュールとソースコードのコピー
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/next/node_modules /app/next/node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY next /app/next

USER nextjs

CMD ["pnpm", "tsx", "thumb/bootstrap.ts"]

# ===============================
# 5. Migration Stage
# ===============================

FROM base AS migration

WORKDIR /app/next

# 依存モジュールをコピー
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/next/node_modules /app/next/node_modules

# マイグレーションに必要なファイルをコピー
COPY next/prisma /app/next/prisma
COPY next/prisma.config.ts /app/next/prisma.config.ts

CMD ["node_modules/.bin/prisma", "migrate", "deploy"]
