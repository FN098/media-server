import { ParsedDatabaseURL } from "@/lib/utils/db-url-parser";
import { spawn } from "child_process";
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";

type MySqlExitStatus = {
  code: number;
  signal: string | null;
};

export async function restoreDatabaseFromFile(
  db: ParsedDatabaseURL,
  filePath: string
): Promise<MySqlExitStatus> {
  if (db.protocol !== "mysql" && db.protocol !== "mariadb") {
    throw new Error("Target database must be MySQL or MariaDB");
  }

  // 読み込み用ファイルストリームを生成
  const readStream = createReadStream(filePath);

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

  childProcess.stdin.on("error", (err) => {
    console.error("mysql stdin error:", err);
  });

  // 終了コードが 0 以外なら throw
  const exitPromise = new Promise((resolve, reject) => {
    childProcess.on("error", reject);

    childProcess.on("close", (code, signal) => {
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              `mysql exited with code ${code} (signal: ${signal})`
          )
        );
        return;
      }
      resolve({ code, signal } satisfies MySqlExitStatus);
    });
  });

  try {
    // ファイルのストリームを mysql の標準入力へパイプラインで流し込む
    await pipeline(readStream, childProcess.stdin);
    const status = await exitPromise;
    return status as MySqlExitStatus;
  } catch (error) {
    readStream.destroy();
    childProcess.kill("SIGTERM");
    throw error;
  }
}
