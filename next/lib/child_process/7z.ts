import { spawn } from "child_process";

/**
 * 7-Zip を用いた解凍処理（Promiseベース）
 * @param archivePath 解凍対象のファイルパス (.zip, .rar など)
 * @param outputDir 解凍先のディレクトリパス
 */
export async function extractArchive(
  archivePath: string,
  outputDir: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn("7z", [
      // 'x': ディレクトリ構造を維持
      // '-o...': 出力先指定（スペースなし）
      // '-y': すべて自動で「はい」応答
      "x",
      archivePath,
      `-o${outputDir}`,
      "-y",
    ]);

    let stdout = "";
    let stderr = "";

    childProcess.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    childProcess.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(
          new Error(`7-Zip 終了コード: ${code}. エラー: ${stderr || stdout}`)
        );
      }
    });

    childProcess.on("error", (err) =>
      reject(new Error(`7-Zip 起動失敗: ${err.message}`))
    );
  });
}
