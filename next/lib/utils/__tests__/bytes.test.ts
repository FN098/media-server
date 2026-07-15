import { formatBytes } from "@/lib/utils/bytes";
import { describe, expect, it } from "vitest";

describe("formatBytes", () => {
  it("0 Bytes を返す", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("Bytes をフォーマットする", () => {
    expect(formatBytes(500)).toBe("500 Bytes");
  });

  it("KB をフォーマットする", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("MB をフォーマットする", () => {
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
  });

  it("GB をフォーマットする", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
  });

  it("デフォルトで小数点2桁に丸める", () => {
    expect(formatBytes(123456789)).toBe("117.74 MB");
  });

  it("小数点桁数を指定できる", () => {
    expect(formatBytes(123456789, { fractionDigits: 1 })).toBe("117.7 MB");
    expect(formatBytes(123456789, { fractionDigits: 0 })).toBe("118 MB");
  });

  it("小数点桁数を指定しても不要な末尾の0は表示しない", () => {
    expect(formatBytes(1024, { fractionDigits: 2 })).toBe("1 KB");
    expect(formatBytes(1024 * 1024, { fractionDigits: 2 })).toBe("1 MB");
  });

  it("末尾の0を表示する場合", () => {
    expect(
      formatBytes(1024, { fractionDigits: 2, trimTrailingZeros: false })
    ).toBe("1.00 KB");
    expect(
      formatBytes(1024 * 1024, { fractionDigits: 2, trimTrailingZeros: false })
    ).toBe("1.00 MB");
  });
});
