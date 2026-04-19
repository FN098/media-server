// 型ガード
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// 安定 stringify
function stableStringify(value: unknown): string {
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (isRecord(value)) {
    const keys = Object.keys(value).sort();

    return `{${keys
      .map((key) => {
        const v = value[key];
        if (v === undefined) return ""; // undefinedは無視
        return `${JSON.stringify(key)}:${stableStringify(v)}`;
      })
      .filter(Boolean)
      .join(",")}}`;
  }

  // function / symbol などは無視
  return "";
}

// FNV-1a
function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }

  return hash.toString(36);
}

export function hashObject(value: unknown): string {
  return fnv1aHash(stableStringify(value));
}
