import { prisma } from "@/lib/prisma";
import { PathSchema } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// TODO: ユーザー認証機能実装後に差し替える
const USER_ID = "dev_user";

const QuerySchema = z.object({
  dir: PathSchema.optional().default(""),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      dir: searchParams.get("dir") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(z.treeifyError(parsed.error), { status: 400 });
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

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
