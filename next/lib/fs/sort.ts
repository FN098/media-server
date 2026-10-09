const collator = new Intl.Collator("ja-JP", {
  numeric: true, // 10 を 2 の後ろにする
  sensitivity: "base", // 大文字小文字・記号差を無視（Explorer寄り）
  ignorePunctuation: true, // 記号を無視
});

export function fsSort(names: string[]): string[] {
  return [...names].sort((a, b) => collator.compare(a, b));
}
