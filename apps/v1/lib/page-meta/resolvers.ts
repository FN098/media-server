import { PageMetaKey, pageMetas } from "@/lib/page-meta/meta";
import { PageMeta, PageMetaRaw } from "@/lib/page-meta/types";

export const pageMetaMap = new Map(
  pageMetas.map((meta) => [meta.key, normalize(meta)])
);

function isVisible(meta: PageMeta) {
  if (meta.hidden) return false;
  if (meta.developmentOnly && process.env.NODE_ENV !== "development")
    return false;
  return true;
}

function normalize(meta: PageMetaRaw): PageMeta {
  return {
    ...meta,
    hidden: meta.hidden ?? false,
    developmentOnly: meta.developmentOnly ?? false,
    backgroundType: {
      light: meta.backgroundType?.light ?? "default",
      dark: meta.backgroundType?.dark ?? "default",
    },
  };
}

function getPageMeta(key: PageMetaKey): PageMeta | null {
  return pageMetaMap.get(key) ?? null;
}

export function resolvePageMeta(key: PageMetaKey): PageMeta | null {
  const meta = getPageMeta(key);
  if (!meta) return null;

  return isVisible(meta) ? meta : null;
}

export function resolvePageMetas(keys: PageMetaKey[]): PageMeta[] {
  const result: PageMeta[] = [];

  for (const key of keys) {
    const meta = resolvePageMeta(key);
    if (meta) result.push(meta);
  }

  return result;
}
