import { sanitize } from "@/lib/virtual-path/guard";

describe("sanitize", () => {
  it("converts backslashes to slashes", () => {
    expect(sanitize("foo\\bar\\baz")).toBe("foo/bar/baz");
  });

  it("removes duplicate slashes", () => {
    expect(sanitize("foo//bar///baz")).toBe("foo/bar/baz");
  });

  it("removes leading and trailing slashes", () => {
    expect(sanitize("/foo/bar/baz/")).toBe("foo/bar/baz");
  });

  it("handles mixed separators", () => {
    expect(sanitize("\\foo//bar\\baz/")).toBe("foo/bar/baz");
  });

  it("returns empty string for root path", () => {
    expect(sanitize("/")).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(sanitize("")).toBe("");
  });
});
