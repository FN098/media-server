import { format, formatDistanceToNow, isYesterday } from "date-fns";
import { ja } from "date-fns/locale";

export function formatLocalDate(
  value: string | Date | null | undefined,
  fallback = "-"
): string {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}/${MM}/${dd} ${hh}:${mm}`;
}

export function formatBytes(
  bytes: number | null | undefined,
  fallback = "-"
): string {
  if (bytes == null || bytes < 0) return fallback;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;

  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

/**
 * Dateオブジェクトを「いい感じ」の文字列にフォーマットする
 * - 1時間未満: 「〜分前」
 * - 今日: 「〜時間前」
 * - 昨日: 「昨日」
 * - それ以前: 「MM/dd」
 */
export function formatRecentDate(
  value: string | Date | null | undefined,
  fallback = "-"
): string {
  if (!value) return fallback;

  const d = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

  // 24時間以内なら相対時間（〜分前、〜時間前）
  if (diffInHours < 24) {
    return formatDistanceToNow(d, { addSuffix: true, locale: ja });
  }

  // 昨日なら「昨日」
  if (isYesterday(d)) {
    return "昨日";
  }

  // それ以前なら「05/20」のような形式
  return format(d, "MM/dd");
}
