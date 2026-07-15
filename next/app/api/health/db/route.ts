import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { internalServerErrorResponse } from "@/lib/response/errors";
import { z } from "zod";

const RowSchema = z.array(z.record(z.string(), z.bigint()));

// DB のヘルスチェック
export async function GET() {
  try {
    const row = await prisma.$queryRaw`SELECT 1`;

    const result = RowSchema.parse(row);

    const isOk = result.length > 0;

    return Response.json({ ok: isOk });
  } catch (error) {
    logger.error("api:db-health-check", error);
    return internalServerErrorResponse();
  }
}
