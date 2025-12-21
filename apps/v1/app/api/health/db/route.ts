import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ResultSchema = z.array(z.record(z.string(), z.bigint()));

export async function GET() {
  try {
    const rawData = await prisma.$queryRaw`SELECT 1`;

    // Zod でパース
    const result = ResultSchema.parse(rawData);

    // BigInt は JSON.stringify できないため、
    // レスポンスに含める場合は数値や文字列に変換する必要があります
    const isOk = result.length > 0;

    return Response.json({ ok: isOk });
  } catch (e) {
    console.error(e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
