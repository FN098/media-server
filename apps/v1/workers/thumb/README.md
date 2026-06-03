## 起動方法

このワーカーは `bootstrap.ts` をエントリーポイントとして起動します。

```bash
pnpm thumb
```

`pnpm thumb` を実行すると、`package.json` の `scripts.thumb` が呼び出され、最終的に以下のコマンドが実行されます。

```bash
tsx workers/thumb/bootstrap.ts
```

実行フロー:

```text
pnpm thumb
  ↓
package.json (scripts.thumb)
  ↓
tsx workers/thumb/bootstrap.ts
```
