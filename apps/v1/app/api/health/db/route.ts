import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const resultSchema = z.array(z.record(z.string(), z.bigint()));

// TODO: response/errors を使う

// DB のヘルスチェック
export async function GET() {
  try {
    const rawData = await prisma.$queryRaw`SELECT 1`;

    const result = resultSchema.parse(rawData);

    const isOk = result.length > 0;

    return NextResponse.json({ ok: isOk });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
