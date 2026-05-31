import {
  ChildProcessExitStatus,
  DumpDatabaseResult,
} from "@/lib/child_process/types";
import { ParsedDatabaseURL } from "@/lib/db/types";
import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { unlink } from "fs/promises";
import { pipeline } from "stream/promises";

export async function dumpDatabaseToFile(
  db: ParsedDatabaseURL,
  filePath: string
): Promise<DumpDatabaseResult> {
  if (db.protocol !== "mysql" && db.protocol !== "mariadb") {
    throw new Error("Target database must be MySQL or MariaDB");
  }

  // 書き込み用ファイルストリームを生成
  const writeStream = createWriteStream(filePath);

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

  // 終了コードが 0 以外なら throw
  const exitPromise = new Promise((resolve, reject) => {
    childProcess.on("error", reject);

    childProcess.on("close", (code, signal) => {
      resolve({ code, signal } satisfies ChildProcessExitStatus);
    });
  });

  try {
    // mysqldump の標準出力をダンプファイルへパイプラインで流し込む
    await pipeline(childProcess.stdout, writeStream);

    // プロセスの終了を待機して終了ステータスを取得
    const exitStatus = (await exitPromise) as ChildProcessExitStatus;

    return {
      ok: exitStatus.code === 0,
      exitStatus,
      error: stderr || undefined,
    };
  } catch (error) {
    writeStream.destroy();
    childProcess.kill("SIGTERM");

    // 中途半端に残ったダンプファイルを削除
    try {
      await unlink(filePath);
    } catch {
      // ファイルが存在しないなどのエラーは無視
    }

    throw error;
  }
}
