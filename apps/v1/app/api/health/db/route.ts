import { prisma } from "@/lib/prisma";
import { internalServerErrorResponse } from "@/lib/response/errors";
import { logger } from "better-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const resultSchema = z.array(z.record(z.string(), z.bigint()));

// DB のヘルスチェック
export async function GET() {
  try {
    const rawData = await prisma.$queryRaw`SELECT 1`;

    const result = resultSchema.parse(rawData);

    const isOk = result.length > 0;

    return NextResponse.json({ ok: isOk });
  } catch (error) {
    logger.error("api:db-health-check", error);
    return internalServerErrorResponse();
  }
}
