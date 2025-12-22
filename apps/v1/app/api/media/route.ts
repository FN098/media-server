import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// TODO: ユーザー認証を正式に実装後に差し替える
const USER_ID = "dev_user";

const QuerySchema = z.object({
  dir: z
    .string()
    .transform((val) => val.replace(/^\/|\/$/g, "")) // 前後のスラッシュ削除
    .optional()
    .default(""),
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

    const dirPath = parsed.data.dir;

    const media = await prisma.media.findMany({
      where: { dirPath },
      orderBy: { path: "asc" },
      include: {
        favorites: {
          where: { userId: USER_ID },
          select: { mediaId: true },
        },
      },
    });

    const result = media.map((m) => ({
      id: m.id,
      path: m.path,
      title: m.title,
      fileMtime: m.fileMtime,
      fileSize: m.fileSize?.toString(),
      isFavorite: m.favorites.length > 0,
    }));

    return Response.json(result);
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
