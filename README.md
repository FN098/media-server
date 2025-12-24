# メディアサーバー

<img width="2560" height="1271" alt="image" src="https://github.com/user-attachments/assets/46fb8bcc-28f6-4827-8d6a-fc5a00c41e99" />

<img width="2560" height="1271" alt="image" src="https://github.com/user-attachments/assets/43a2e4c6-cd36-4e31-91b0-c87141480b67" />

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

