import { ChildProcessExitStatus } from "@/lib/child_process/types";
import { spawn } from "child_process";
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";
import { ParsedDatabaseURL } from "../db/url-parser";

type RestoreDatabaseResult = {
  ok: boolean;
  exitStatus: ChildProcessExitStatus;
  error?: string;
};

export async function restoreDatabaseFromFile(
  db: ParsedDatabaseURL,
  filePath: string
): Promise<RestoreDatabaseResult> {
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

  // mysql の出力バッファ
  let stderr = "";

  childProcess.stderr.on("data", (data: Buffer) => {
    stderr += data.toString();
  });

  // 終了コードが 0 以外なら throw
  const exitPromise = new Promise((resolve, reject) => {
    childProcess.on("error", reject);

    childProcess.on("close", (code, signal) => {
      resolve({ code, signal } satisfies ChildProcessExitStatus);
    });
  });

  try {
    // ファイルのストリームを mysql の標準入力へパイプラインで流し込む
    await pipeline(readStream, childProcess.stdin);

    // プロセスの終了を待機して終了ステータスを取得
    const exitStatus = (await exitPromise) as ChildProcessExitStatus;

    return {
      ok: exitStatus.code === 0,
      exitStatus,
      error: stderr || undefined,
    };
  } catch (error) {
    readStream.destroy();
    childProcess.kill("SIGTERM");
    throw error;
  }
}
