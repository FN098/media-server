import { ParsedDatabaseURL } from "@/lib/utils/database-url";
import { spawn } from "child_process";
import fs from "fs/promises";

export async function dumpDatabaseToFile(
  db: ParsedDatabaseURL,
  filePath: string
) {
  let fileHandle: fs.FileHandle | null = null;

  try {
    fileHandle = await fs.open(filePath, "w");

    await new Promise<void>((resolve, reject) => {
      const process = spawn("mysqldump", [
        "-h",
        db.host,
        "-P",
        db.port,
        "-u",
        db.user,
        `-p${db.password}`,
        db.database,
      ]);

      const stream = fileHandle!.createWriteStream();
      process.stdout.pipe(stream);

      process.stderr.on("data", (data: Buffer) => {
        console.error("mysqldump error:", data.toString());
      });

      process.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`mysqldump exited with code ${code}`));
      });

      process.on("error", reject);
    });
  } catch (error) {
    // ゴミファイル削除
    try {
      await fs.unlink(filePath);
    } catch {}

    throw error;
  } finally {
    // ファイルハンドルは必ず解放
    if (fileHandle) {
      try {
        await fileHandle.close();
      } catch {}
    }
  }
}
