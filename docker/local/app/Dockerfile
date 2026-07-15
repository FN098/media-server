# 開発用イメージ（軽量）
FROM node:25-slim

WORKDIR /app

# パッケージインストール
# git: ソース管理
# ffmpeg: 動画サムネイル生成
# default-mysql-client: DB バックアップ・リストア
# ca-certificates: github 公開キー検証
# p7zip-full: 圧縮ファイル解凍
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ffmpeg \
    default-mysql-client \
    ca-certificates \
    p7zip-full \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# セキュリティのため非ルートユーザーを作成
# --system: VSCode でアタッチして開発するので不要
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# pnpm をグローバルインストール
RUN npm i -g pnpm

# ユーザーを root -> nextjs に切り替え
USER nextjs

# package*.json と lock と workspace を先にコピー
COPY --chown=nextjs:nodejs pnpm-lock.yaml pnpm-workspace.yaml /app
COPY --chown=nextjs:nodejs next/package.json /app/next

# 依存インストール
RUN pnpm install --frozen-lockfile --filter @media-server/next

# ソース全体をコピー
COPY --chown=nextjs:nodejs . /app

# ダミー用の接続文字列を環境変数に設定（これがないと prisma generate に失敗する）
ENV DATABASE_URL dummy
ENV SHADOW_DATABASE_URL dummy

WORKDIR /app/next

# Prisma 生成
RUN pnpm prisma generate

EXPOSE 3000

CMD ["pnpm", "dev"]
