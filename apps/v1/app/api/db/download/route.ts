import { getMimetype } from "@/lib/media/mimetype";
import { getServerMediaDbPath } from "@/lib/path/helpers";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { Readable } from "stream";

const BACKUP_DIR = getServerMediaDbPath("");

export function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("file");

    if (!fileName) {
      return NextResponse.json(
        { error: "ファイル名が必要です" },
        { status: 400 }
      );
    }

    // セキュリティ対策: ファイル名にスラッシュ等が含まれないかチェック（ディレクトリトラバーサル防止）
    if (
      fileName.includes("/") ||
      fileName.includes("..") ||
      !fileName.endsWith(".sql")
    ) {
      return NextResponse.json(
        { error: "不正なファイル名です" },
        { status: 400 }
      );
    }

    const filePath = path.join(BACKUP_DIR, fileName);

    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 404 }
      );
    }

    // ファイルを読み込みストリームとして作成
    const fileStream = fs.createReadStream(filePath);
    const webStream = Readable.toWeb(fileStream);

    // ファイルロックが解除されない問題の対策
    req.signal.addEventListener(
      "abort",
      () => {
        if (!fileStream.destroyed) {
          fileStream.destroy();
        }
      },
      { once: true }
    );
    fileStream.on("error", (err) => {
      console.error("stream error", err);
    });

    // レスポンスヘッダーの設定
    // ブラウザに「ダウンロード」として認識させる
    return new NextResponse(webStream as ReadableStream, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": getMimetype(filePath),
      },
    });
  } catch (error) {
    console.error("Download Error:", error);
    return NextResponse.json(
      { error: "ダウンロード中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
