export function removeExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0) return filename; // 拡張子なし or .gitignore 対策
  return filename.slice(0, lastDot);
}

export function removeAllExtensions(filename: string): string {
  const stripped = filename.replace(/\.[^/.]+/g, "");
  return stripped.length > 0 ? stripped : filename;
}

export function getExtension(
  filename: string,
  options?: {
    withDot?: boolean;
    case?: "lower" | "upper";
  }
): string {
  const withDot = options?.withDot ?? false;
  const caseOpt = options?.case;

  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return "";
  }

  let ext = withDot ? filename.slice(lastDot) : filename.slice(lastDot + 1);

  if (caseOpt === "lower") ext = ext.toLowerCase();
  if (caseOpt === "upper") ext = ext.toUpperCase();

  return ext;
}
