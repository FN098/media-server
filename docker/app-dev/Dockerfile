# 開発用イメージ（軽量）
FROM node:25-slim

# 必須パッケージインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    ffmpeg \
    default-mysql-client \
    ca-certificates \
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
