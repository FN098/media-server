import { format, formatDistanceToNow, isYesterday } from "date-fns";
import { ja } from "date-fns/locale";

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
