import { ParsedDatabaseURL } from "@/lib/utils/database-url";
import { spawn } from "child_process";
import { once } from "events";
import fs from "fs/promises";
import { finished } from "stream/promises";

export async function dumpDatabaseToFile(
  db: ParsedDatabaseURL,
  filePath: string
) {
  const fileHandle = await fs.open(filePath, "w");

  try {
    // バックグラウンドプロセスで mysqldump を起動
    const childProcess = spawn(
      "mysqldump",
      ["-h", db.host, "-P", db.port, "-u", db.user, db.database],
      {
        env: {
          ...process.env,
          MYSQL_PWD: db.password,
        },
      }
    );

    // mysqldump の標準エラー出力バッファ
    let stderr = "";

    childProcess.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    const writeStream = fileHandle.createWriteStream();

    // mysqldump の標準出力をダンプファイルへ書き込む
    childProcess.stdout.pipe(writeStream);

    // mysqldump の終了を待機して終了コードを取得
    const [code] = (await Promise.race([
      once(childProcess, "close"),
      once(childProcess, "error").then(([err]) => {
        throw err;
      }),
    ])) as [number];

    // ファイルストリームの書き込み完了を待機
    await finished(writeStream);

    // 0 (正常終了) 以外なら例外スローしてエスカレーション
    if (code !== 0) {
      throw new Error(stderr || `mysqldump exited with code ${code}`);
    }
  } catch (error) {
    // ゴミファイル削除
    try {
      await fs.unlink(filePath);
    } catch {}

    throw error;
  } finally {
    // ファイルハンドルは必ず解放
    await fileHandle.close().catch(() => {});
  }
}
