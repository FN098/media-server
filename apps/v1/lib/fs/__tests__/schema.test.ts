import { PathSchema } from "@/lib/fs/schemas";
import { describe, expect, it } from "vitest";

describe("PathSchema", () => {
  it("normalizes windows path", () => {
    expect(PathSchema.parse("\\foo\\bar")).toBe("foo/bar");
  });

  it("removes leading slash", () => {
    expect(PathSchema.parse("/foo/bar")).toBe("foo/bar");
  });
});
