# メンテナンスツール

## カナ追加

Table.kana が未設定の行に対し、 kana の値を更新する。

### 使い方

```sh
pnpm tsx ./tools/fill-missing-tag-kana.ts
```

## カナ修正

Table.kana にひらがなが混じった行に対し、kana の値をカタカナに修正する。

### 使い方

```sh
pnpm tsx ./tools/fix-and-fill-tag-kana.ts
```

## メディアタイプ修正

Media.type が未設定の行に対し、type の値を更新する。

### 使い方

```sh
pnpm tsx ./tools/update-media-types.ts
```
