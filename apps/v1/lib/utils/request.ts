import { NextRequest } from "next/server";

export async function safeParseRequestJson<T>(
  req: NextRequest
): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch (e) {
    console.error(e);
    return null;
  }
}
