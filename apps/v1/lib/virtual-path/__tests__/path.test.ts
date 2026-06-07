import {
  basename,
  dirname,
  extname,
  join,
  sanitize,
} from "@/lib/virtual-path/path";
import { describe, expect, it } from "vitest";

describe("join", () => {
  it("joins paths with posix separators", () => {
    expect(join("foo", "bar", "baz.txt")).toBe("foo/bar/baz.txt");
  });

  it("ignores empty segments", () => {
    expect(join("foo", "", "bar")).toBe("foo/bar");
  });

  it("joins filename onto empty base path", () => {
    expect(join("", "filename")).toBe("filename");
  });

  it("returns empty string when all segments are empty", () => {
    expect(join("", "")).toBe("");
  });

  it("returns empty string when no arguments are provided", () => {
    expect(join()).toBe("");
  });

  it("returns empty string for a single empty segment", () => {
    expect(join("")).toBe("");
  });
});

describe("dirname", () => {
  it("returns parent directory", () => {
    expect(dirname("foo/bar/baz.txt")).toBe("foo/bar");
  });

  it("returns current directory when no parent exists", () => {
    expect(dirname("foo")).toBe(".");
  });
});

describe("basename", () => {
  it("returns filename", () => {
    expect(basename("foo/bar/baz.txt")).toBe("baz.txt");
  });

  it("removes suffix when provided", () => {
    expect(basename("foo/bar/baz.txt", ".txt")).toBe("baz");
  });
});

describe("extname", () => {
  it("returns file extension", () => {
    expect(extname("foo/bar/baz.txt")).toBe(".txt");
  });

  it("returns empty string when extension does not exist", () => {
    expect(extname("foo/bar/baz")).toBe("");
  });
});

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
