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

# pnpm をグローバルインストール
RUN npm i -g pnpm

# セキュリティのため非ルートユーザーを作成
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# ソース全体をコピー
COPY --chown=nextjs:nodejs . .

WORKDIR /app/next

# 依存インストール
RUN pnpm install --frozen-lockfile

# ダミー用の接続文字列を環境変数に設定（これがないと prisma generate に失敗する）
ENV DATABASE_URL "mysql://user:pass@db:3306/dummy"
ENV SHADOW_DATABASE_URL "mysql://user:pass@db:3306/dummy"

# Prisma 生成
RUN pnpm prisma generate

EXPOSE 3000

# ユーザーを root -> nextjs に切り替え
# USER nextjs

CMD ["pnpm", "dev"]
