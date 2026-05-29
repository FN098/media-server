import { ParsedDatabaseURL } from "@/lib/utils/database-url";
import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { unlink } from "fs/promises";
import { pipeline } from "stream/promises";

export async function dumpDatabaseToFile(
  db: ParsedDatabaseURL,
  filePath: string
) {
  // ファイルストリームを生成
  const writeStream = createWriteStream(filePath);

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

    // mysqldump の標準出力をダンプファイルへ書き込む
    await pipeline(childProcess.stdout, writeStream);

    // 終了コードが 0 以外（null や 1 以上のエラーコード）なら一括で弾く
    if (childProcess.exitCode !== 0) {
      throw new Error(
        stderr.trim() ||
          `mysqldump exited with code ${childProcess.exitCode} (signal: ${childProcess.signalCode})`
      );
    }
  } catch (error) {
    // ファイルストリームを確実に閉じる
    writeStream.destroy();

    // ゴミファイル削除
    try {
      await unlink(filePath);
    } catch {
      // ファイルが存在しないなどのエラーは無視
    }

    throw error;
  }
}
