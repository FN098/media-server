import { ParsedDatabaseURL } from "@/lib/utils/db-url-parser";
import { spawn } from "child_process";
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";

export async function restoreDatabaseFromFile(
  db: ParsedDatabaseURL,
  filePath: string
) {
  if (db.protocol !== "mysql" && db.protocol !== "mariadb") {
    throw new Error("Target database must be MySQL or MariaDB");
  }

  // 読み込み用ファイルストリームを生成
  const readStream = createReadStream(filePath);

  try {
    // バックグラウンドプロセスで mysql コマンドを起動
    const childProcess = spawn(
      "mysql",
      ["-h", db.host, "-P", db.port, "-u", db.user, db.database],
      {
        env: {
          ...process.env,
          MYSQL_PWD: db.password, // パスワードは環境変数で安全に渡す
        },
      }
    );

    // mysql の標準エラー出力バッファ
    let stderr = "";
    childProcess.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    // ファイルのストリームを mysql の標準入力へパイプラインで流し込む
    await pipeline(readStream, childProcess.stdin);

    // 終了コードが 0 以外ならエラーを投げる
    if (childProcess.exitCode !== 0) {
      throw new Error(
        stderr.trim() ||
          `mysql exited with code ${childProcess.exitCode} (signal: ${childProcess.signalCode})`
      );
    }
  } catch (error) {
    // エラー時は確実にストリームを破棄
    readStream.destroy();
    throw error;
  }
}
