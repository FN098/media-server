import {
  VirtualPathSchema,
  VirtualPathSegmentSchema,
} from "@/lib/virtual-path/schemas";

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
] as const;

describe("VirtualPathSegmentSchema", () => {
  describe("valid segments", () => {
    it.each(["foo", "foo.txt", "my-file", "my_file", "画像", "大阪.jpg"])(
      "accepts %s",
      (segment) => {
        expect(VirtualPathSegmentSchema.parse(segment)).toBe(segment);
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
      expect(() => VirtualPathSegmentSchema.parse(segment)).toThrow();
    });
  });

  describe("reserved names", () => {
    it.each(RESERVED_NAMES)("rejects reserved name %s", (name) => {
      expect(() => VirtualPathSegmentSchema.parse(name)).toThrow();
      expect(() => VirtualPathSegmentSchema.parse(`${name}.txt`)).toThrow();
    });

    it.each(["con", "Con", "cOn", "nul", "Com1", "lPt9"])(
      "rejects reserved name regardless of case: %s",
      (segment) => {
        expect(() => VirtualPathSegmentSchema.parse(segment)).toThrow();
      }
    );
  });

  describe("whitespace handling", () => {
    it.each([" foo", "foo ", " foo "])(
      "rejects segment with leading/trailing whitespace: %s",
      (segment) => {
        expect(() => VirtualPathSegmentSchema.parse(segment)).toThrow();
      }
    );
  });
});

describe("VirtualPathSchema", () => {
  describe("valid paths", () => {
    it("accepts simple path", () => {
      expect(VirtualPathSchema.parse("foo/bar")).toBe("foo/bar");
    });

    it("accepts japanese path", () => {
      expect(VirtualPathSchema.parse("画像/旅行/大阪.jpg")).toBe(
        "画像/旅行/大阪.jpg"
      );
    });

    it("accepts file with extension", () => {
      expect(VirtualPathSchema.parse("foo/bar.txt")).toBe("foo/bar.txt");
    });
  });

  describe("invalid paths", () => {
    it("rejects double slash", () => {
      expect(() => VirtualPathSchema.parse("foo//bar")).toThrow();
    });

    it("rejects trailing slash", () => {
      expect(() => VirtualPathSchema.parse("foo/bar/")).toThrow();
    });

    it("rejects dot segment", () => {
      expect(() => VirtualPathSchema.parse("foo/./bar")).toThrow();
    });

    it("rejects parent segment", () => {
      expect(() => VirtualPathSchema.parse("foo/../bar")).toThrow();
    });

    it("rejects reserved names", () => {
      expect(() => VirtualPathSchema.parse("foo/CON/bar")).toThrow();
    });

    it("rejects invalid characters", () => {
      expect(() => VirtualPathSchema.parse("foo/te<st/bar")).toThrow();
    });
  });

  describe("reserved names", () => {
    it.each(RESERVED_NAMES)("rejects reserved name %s", (name) => {
      expect(() => VirtualPathSchema.parse(name)).toThrow();
      expect(() => VirtualPathSchema.parse(`${name}.txt`)).toThrow();
    });

    it.each(["con", "Con", "cOn", "nul", "Com1", "lPt9"])(
      "rejects reserved name regardless of case: %s",
      (name) => {
        expect(() => VirtualPathSchema.parse(name)).toThrow();
        expect(() => VirtualPathSchema.parse(`foo/${name}/bar`)).toThrow();
      }
    );
  });
});
