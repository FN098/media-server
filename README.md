# メディアサーバー

<img width="2560" height="1311" alt="image" src="https://github.com/user-attachments/assets/8f93a778-eac6-4771-8d9b-01194b8f98cd" />

ローカルメディアをウェブサーバー経由で配信します。

ローカル環境で動作する前提であり、外部にデータが送信される恐れはありません。

## インストール

```sh
# .env ファイルコピー
cp .env.example .env

# 必要に応じて .env を編集 (ローカルのメディアフォルダの指定など)

# コンテナ起動
docker compose --profile prod up -d --build
```
