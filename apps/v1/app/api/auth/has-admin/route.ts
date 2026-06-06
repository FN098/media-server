import { db } from "@/lib/prisma";
import { internalServerErrorResponse } from "@/lib/response/errors";
import { logger } from "better-auth";
import { NextResponse } from "next/server";

// このエンドポイントは認証不要とする
export async function GET() {
  try {
    const adminCount = await db.user.count({
      where: {
        role: "admin",
      },
    });

    const hasAdmin = adminCount > 0;

    return NextResponse.json({ hasAdmin });
  } catch (error) {
    logger.error("api:users-has-admin", error);
    return internalServerErrorResponse();
  }
}
