import { prisma } from "@/lib/prisma";
import z from "zod";

const PathsSchema = z.array(z.string());

export async function GET(request: Request) {
  // const { searchParams } = new URL(request.url);
  // const parsed = PathsSchema.safeParse(
  //   JSON.parse(searchParams.get("paths") || "[]")
  // );
  // if (!parsed.success) {
  //   return new Response("Invalid paths", { status: 400 });
  // }

  // const paths = parsed.data;

  const tags = await prisma.tag.findMany({
    // where: {
    //   OR: [
    //     // 1. 現在表示中のディレクトリ内のメディアが既に使用しているタグ
    //     {
    //       mediaTags: {
    //         some: {
    //           media: { path: { in: paths } },
    //         },
    //       },
    //     },
    //     // 2. あるいは、全メディアの中でよく使われているタグ（上位30件など）
    //     {
    //       mediaTags: {
    //         _count: { gte: 1 }, // 何かしら紐付いているもの
    //       },
    //     },
    //   ],
    // },
    take: 100, // 取得件数を制限
    orderBy: {
      name: "asc",
    },
  });

  return Response.json(tags);
}
