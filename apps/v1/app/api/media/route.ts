import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const QuerySchema = z.object({
  dir: z
    .string()
    .startsWith("/", "絶対パスを指定してください")
    .transform((val) => val.replace(/\/$/, "")) // 末尾のスラッシュを削除して正規化
    .optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      dir: searchParams.get("dir") ?? undefined,
    });

    if (!parsed.success) {
      return Response.json({ error: "invalid query" }, { status: 400 });
    }

    const dirPath = parsed.data.dir ?? "";

    const media = await prisma.media.findMany({
      where: {
        dirPath,
      },
      orderBy: { path: "asc" },
    });

    return Response.json(media);
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
