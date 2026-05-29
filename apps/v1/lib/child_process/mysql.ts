import { ParsedDatabaseURL } from "@/lib/utils/url";
import { spawn } from "child_process";
import fs from "fs/promises";

export async function restoreDatabaseFromFile(
  db: ParsedDatabaseURL,
  filePath: string
) {
  let fileHandle: fs.FileHandle | null = null;

  try {
    fileHandle = await fs.open(filePath, "r");

    await new Promise<void>((resolve, reject) => {
      const process = spawn("mysql", [
        "-h",
        db.host,
        "-P",
        db.port,
        "-u",
        db.user,
        `-p${db.password}`,
        db.database,
      ]);

      const stream = fileHandle!.createReadStream();
      stream.pipe(process.stdin);

      stream.on("end", () => {
        process.stdin.end();
      });

      process.stderr.on("data", (data: Buffer) => {
        console.error("mysql error:", data.toString());
      });

      process.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`mysql exited with code ${code}`));
      });

      process.on("error", reject);
    });
  } finally {
    // ファイルハンドルは必ず解放
    if (fileHandle) {
      try {
        await fileHandle.close();
      } catch {}
    }
  }
}
