## ⚠️注意

このフォルダ内のファイルは直接編集しないこと。(override 以下のファイルを除く)

また、フォルダ名の変更も禁止とする。

Shadcn は頻繁に更新されるため、ユーザー側で編集してしまうと更新が面倒になる。

## 📄公式ドキュメント

https://ui.shadcn.com/docs/installation/next

## 🔄️インストール・アップデート

コンポーネント追加

```sh
pnpm dlx shadcn@latest add --all --overwrite
```

## 🛠️カスタマイズ

コンポーネントのカスタマイズが必要な場合、以下のフォルダに元ファイルと同じ名前で作成する

shadcn/components/ui/override

例. shadcn/components/ui/override/form.tsx

```tsx
// 必要に応じてインポート
import { useFormField } from "@/shadcn/components/ui/form";
import { cn } from "@/shadcn/lib/utils";

// 以下に再定義するコンポーネントを書く
function FormMessage({
  className,
  t,
  ...props
}: React.ComponentProps<"p"> & { t?: (message: string) => string }) {
  ...
}

// 元ファイルで定義されているコンポーネントをすべてエクスポート
export * from "@/shadcn/components/ui/form";

// 再定義したコンポーネントをエクスポート（必ず最後にエクスポートすること）
export { FormMessage };
```

インポート側

```tsx
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shadcn/components/ui/override/form";
// ↑ 間違って "@/shadcn/components/ui/form" としないように注意すること
```
