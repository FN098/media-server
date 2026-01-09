import z from "@/node_modules/zod/v4/classic/external.cjs";

export const pathSchema = z
  .string()
  .transform((val) => {
    // 1. バックスラッシュをスラッシュに正規化し、前後のスラッシュを削除
    return val.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  })
  .refine(
    (val) => {
      // 2. Windows/Linuxの禁止文字をチェック
      // < > : " | ? * および コントロール文字(0-31)
      const invalidChars = /[<>:"|?*\x00-\x1F]/;
      return !invalidChars.test(val);
    },
    {
      message: 'パスに禁止文字（< > : " | ? * など）が含まれています',
    }
  )
  .refine(
    (val) => {
      // 3. 予約済みファイル名（Windows）のチェック
      const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i;
      const parts = val.split("/");
      return !parts.some((part) => reservedNames.test(part));
    },
    {
      message: "システムで予約されている名前が含まれています",
    }
  );
