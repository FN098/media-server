import { ParsedDatabaseURL } from "@/lib/utils/db-url-parser";
import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { unlink } from "fs/promises";
import { pipeline } from "stream/promises";

export async function dumpDatabaseToFile(
  db: ParsedDatabaseURL,
  filePath: string
) {
  if (db.protocol !== "mysql" && db.protocol !== "mariadb") {
    throw new Error("Target database must be MySQL or MariaDB");
  }

  // 書き込み用ファイルストリームを生成
  const writeStream = createWriteStream(filePath);

  try {
    // バックグラウンドプロセスで mysqldump を起動
    const childProcess = spawn(
      "mysqldump",
      ["-h", db.host, "-P", db.port, "-u", db.user, db.database],
      {
        env: {
          ...process.env,
          MYSQL_PWD: db.password, // パスワードは環境変数で安全に渡す
        },
      }
    );

    // mysqldump の標準エラー出力バッファ
    let stderr = "";
    childProcess.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    // mysqldump の標準出力をダンプファイルへパイプラインで流し込む
    await pipeline(childProcess.stdout, writeStream);

    // 終了コードが 0 以外ならエラーを投げる
    if (childProcess.exitCode !== 0) {
      throw new Error(
        stderr.trim() ||
          `mysqldump exited with code ${childProcess.exitCode} (signal: ${childProcess.signalCode})`
      );
    }
  } catch (error) {
    // エラー時は確実にストリームを破棄
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
