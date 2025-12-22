import { createFavorite, deleteFavorite } from "@/lib/favorite/repository";
import { findMediaByPath } from "@/lib/media/repository";
import { safeParseRequestJson } from "@/lib/request";
import { findUserById } from "@/lib/user/repository";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// TODO: ユーザー認証機能実装後に差し替える
const USER_ID = "dev_user";

const BodySchema = z.object({
  path: z.string(),
});

// TODO: GET実装
// const res = await fetch(`/api/favorite?path=${encodeURIComponent(path)}`);

export async function POST(req: NextRequest) {
  try {
    // TODO: ユーザー認証機能実装後に差し替える
    const user = await findUserById(USER_ID);
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const json = await safeParseRequestJson(req);
    if (!json) return new NextResponse("Invalid Json", { status: 400 });

    const parsed = BodySchema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json(z.treeifyError(parsed.error), { status: 400 });

    const { path } = parsed.data;

    const media = await findMediaByPath(path);
    if (!media) return new NextResponse("Media not found", { status: 404 });

    await createFavorite(user.id, media.id);

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // TODO: ユーザー認証機能実装後に差し替える
    const user = await findUserById(USER_ID);
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const json = await safeParseRequestJson(req);
    if (!json) return new NextResponse("Invalid Json", { status: 400 });

    const parsed = BodySchema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json(z.treeifyError(parsed.error), { status: 400 });

    const { path } = parsed.data;

    const media = await findMediaByPath(path);
    if (!media) return new NextResponse("Media not found", { status: 404 });

    await deleteFavorite(user.id, media.id);

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
