import { spawn } from "child_process";

export async function createVideoThumb(
  videoPath: string,
  thumbPath: string
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const childProcess = spawn("ffmpeg", [
      "-y",
      "-v",
      "quiet",
      "-i",
      videoPath,
      "-vframes",
      "1",
      "-q:v",
      "80",
      thumbPath,
    ]);

    // プロセスが起動できなかった場合などのエラー処理
    childProcess.on("error", (err) => {
      reject(new Error(`Failed to start ffmpeg: ${err.message}`));
    });

    childProcess.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `Error creating '${thumbPath}'. ffmpeg exited with code ${code}`
          )
        );
    });
  });
}
