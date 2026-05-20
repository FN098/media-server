import { spawn } from "child_process";

/**
 * 7-Zip を用いた解凍処理（Promiseベース）
 * @param archivePath 解凍対象のファイルパス (.zip, .rar など)
 * @param outputDir 解凍先のディレクトリパス
 */
export async function extractWith7Zip(
  archivePath: string,
  outputDir: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 'x': ディレクトリ構造を維持
    // '-o...': 出力先指定（スペースなし）
    // '-y': すべて自動で「はい」応答
    const args = ["x", archivePath, `-o${outputDir}`, "-y"];
    const process7z = spawn("7z", args);

    let stdout = "";
    let stderr = "";

    process7z.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    process7z.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    process7z.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(
          new Error(`7-Zip 終了コード: ${code}. エラー: ${stderr || stdout}`)
        );
      }
    });

    process7z.on("error", (err) =>
      reject(new Error(`7-Zip 起動失敗: ${err.message}`))
    );
  });
}
