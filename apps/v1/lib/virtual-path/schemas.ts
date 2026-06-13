import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
import { isRootPath } from "@/lib/virtual-path/guard";
import {
  WINDOWS_INVALID_CHARS,
  WINDOWS_RESERVED_NAMES,
} from "@/lib/virtual-path/windows-os";
import { z } from "zod";

export const VirtualPathSegmentSchema = z
  .string()
  .superRefine((segment, ctx) => {
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
    const result = VirtualPathSegmentSchema.safeParse(segment);

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

export const FileNameSchema = VirtualPathSegmentSchema;
export const FolderNameSchema = VirtualPathSegmentSchema;
export const FileOrFolderNameSchema = VirtualPathSegmentSchema;

export const EditableVirtualPathSchema = VirtualPathSchema.superRefine(
  (path, ctx) => {
    if (isRootPath(path)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ルートフォルダは操作できません。",
      });
    }

    if (isSystemHiddenVirtualPath(path)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "システムフォルダは操作できません。",
      });
    }
  }
);
