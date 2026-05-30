import { PathSchema, PathSegmentSchema } from "@/lib/path/schemas";
import { describe, expect, it } from "vitest";

describe("PathSegmentSchema", () => {
  describe("valid segments", () => {
    it.each(["foo", "foo.txt", "my-file", "my_file", "画像", "大阪.jpg"])(
      "accepts %s",
      (segment) => {
        expect(PathSegmentSchema.parse(segment)).toBe(segment);
      }
    );
  });

  describe("invalid segments", () => {
    it.each([
      "",
      ".",
      "..",
      "foo/",
      "foo\\",
      "foo<bar",
      "foo>bar",
      "foo:bar",
      'foo"bar',
      "foo|bar",
      "foo?bar",
      "foo*bar",
      "foo.",
      "foo ",
    ])("rejects %s", (segment) => {
      expect(() => PathSegmentSchema.parse(segment)).toThrow();
    });
  });

  describe("reserved names", () => {
    it.each([
      "CON",
      "PRN",
      "AUX",
      "NUL",
      "COM1",
      "COM9",
      "LPT1",
      "LPT9",
      "CON.txt",
      "nul.jpg",
      "com1.png",
    ])("rejects %s", (segment) => {
      expect(() => PathSegmentSchema.parse(segment)).toThrow();
    });

    it.each(["con", "Con", "cOn", "nul", "Com1", "lPt9"])(
      "rejects reserved name regardless of case: %s",
      (segment) => {
        expect(() => PathSegmentSchema.parse(segment)).toThrow();
      }
    );
  });

  describe("trim behavior", () => {
    it.each([" foo", "foo ", " foo "])(
      "rejects segment with leading/trailing whitespace: %s",
      (segment) => {
        expect(() => PathSegmentSchema.parse(segment)).toThrow();
      }
    );
  });
});

describe("PathSchema", () => {
  describe("normalization", () => {
    it("converts backslashes to slashes", () => {
      expect(PathSchema.parse("foo\\bar")).toBe("foo/bar");
    });

    it("removes leading slash", () => {
      expect(PathSchema.parse("/foo/bar")).toBe("foo/bar");
    });

    it("removes multiple leading slashes", () => {
      expect(PathSchema.parse("///foo/bar")).toBe("foo/bar");
    });
  });

  describe("valid paths", () => {
    it("accepts simple path", () => {
      expect(PathSchema.parse("foo/bar")).toBe("foo/bar");
    });

    it("accepts japanese path", () => {
      expect(PathSchema.parse("画像/旅行/大阪.jpg")).toBe("画像/旅行/大阪.jpg");
    });

    it("accepts file with extension", () => {
      expect(PathSchema.parse("foo/bar.txt")).toBe("foo/bar.txt");
    });
  });

  describe("invalid paths", () => {
    it("rejects empty path", () => {
      expect(() => PathSchema.parse("")).toThrow();
    });

    it("rejects double slash", () => {
      expect(() => PathSchema.parse("foo//bar")).toThrow();
    });

    it("rejects trailing slash", () => {
      expect(() => PathSchema.parse("foo/bar/")).toThrow();
    });

    it("rejects dot segment", () => {
      expect(() => PathSchema.parse("foo/./bar")).toThrow();
    });

    it("rejects parent segment", () => {
      expect(() => PathSchema.parse("foo/../bar")).toThrow();
    });

    it("rejects reserved names", () => {
      expect(() => PathSchema.parse("foo/CON/bar")).toThrow();
    });

    it("rejects invalid characters", () => {
      expect(() => PathSchema.parse("foo/te<st/bar")).toThrow();
    });
  });

  describe("reserved names", () => {
    const RESERVED_NAMES = [
      "CON",
      "PRN",
      "AUX",
      "NUL",
      "COM1",
      "COM2",
      "COM3",
      "COM4",
      "COM5",
      "COM6",
      "COM7",
      "COM8",
      "COM9",
      "LPT1",
      "LPT2",
      "LPT3",
      "LPT4",
      "LPT5",
      "LPT6",
      "LPT7",
      "LPT8",
      "LPT9",
    ];

    it.each(RESERVED_NAMES)("rejects reserved name %s", (name) => {
      expect(() => PathSchema.parse(name)).toThrow();
      expect(() => PathSchema.parse(`${name}.txt`)).toThrow();
    });
  });
});
