import { z } from "zod";

const WINDOWS_INVALID_CHARS = /[<>:"|?*\u0000-\u001F]/;

const WINDOWS_RESERVED_NAMES = new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
]);

export const PathSegmentSchema = z.string().superRefine((segment, ctx) => {
  if (!segment) {
    ctx.addIssue({
      code: "custom",
      message: "セグメントが空です",
    });
    return;
  }

  if (segment !== segment.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "先頭または末尾に空白を含めることはできません",
    });
  }

  if (segment.includes("/") || segment.includes("\\")) {
    ctx.addIssue({
      code: "custom",
      message: "セグメントにパス区切り文字は使用できません",
    });
  }

  if (segment === "." || segment === "..") {
    ctx.addIssue({
      code: "custom",
      message: `使用できないパス要素です: ${segment}`,
    });
  }

  if (WINDOWS_INVALID_CHARS.test(segment)) {
    ctx.addIssue({
      code: "custom",
      message: `使用できない文字が含まれています: ${segment}`,
    });
  }

  if (/[. ]$/.test(segment)) {
    ctx.addIssue({
      code: "custom",
      message: `末尾のピリオドまたはスペースは禁止です: ${segment}`,
    });
  }

  const basename = segment.split(".")[0].toUpperCase();

  if (WINDOWS_RESERVED_NAMES.has(basename)) {
    ctx.addIssue({
      code: "custom",
      message: `予約名は使用できません: ${segment}`,
    });
  }
});

// 仮想パス。先頭スラッシュ禁止
export const VirtualPathSchema = z.string().superRefine((value, ctx) => {
  if (value === "") return;

  if (value.startsWith("/")) {
    ctx.addIssue({
      code: "custom",
      message: "先頭のスラッシュは使用できません",
    });
  }

  if (value.includes("//")) {
    ctx.addIssue({
      code: "custom",
      message: "連続したスラッシュは使用できません",
    });
  }

  if (value.endsWith("/")) {
    ctx.addIssue({
      code: "custom",
      message: "末尾のスラッシュは使用できません",
    });
  }

  const segments = value.split("/");

  for (const [index, segment] of segments.entries()) {
    const result = PathSegmentSchema.safeParse(segment);

    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: [index],
        });
      }
    }
  }
});

export const VirtualPathOneSchema = VirtualPathSchema;
export const VirtualPathManySchema = z.array(VirtualPathSchema);

export const FileNameSchema = PathSegmentSchema;
export const FolderNameSchema = PathSegmentSchema;
