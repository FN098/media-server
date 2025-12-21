import { getMediaFsListing } from "@/lib/explorer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams.get("p") ?? "";
    const data = await getMediaFsListing(p);

    return NextResponse.json(data);
  } catch (e) {
    console.error("Internal Server Error:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
