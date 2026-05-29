import { createThumbs } from "@/lib/child_process/thumbs-creator";
import { getFsNode, listFsNodes } from "@/lib/media/fs";
import { sortNodes } from "@/lib/media/sort";
import { chunk } from "@/lib/utils/array";
import { ThumbJobData } from "@/workers/thumb/types";
import { Worker } from "bullmq";
import { connection } from "./queue";

const EXPIRE_MS = 1000 * 60 * 10; // 10分

export const startThumbWorker = () => {
  console.log("🚀 Thumb worker process started");

  const worker = new Worker<ThumbJobData>(
    "thumbs",
    async (job) => {
      const { dirPath, filePath, createdAt, forceCreate } = job.data;

      // 発行から時間が経ちすぎたジョブは処理せず破棄
      if (Date.now() - createdAt > EXPIRE_MS) {
        console.log(`[Job ${job.id}] expired, removing`);
        await job.remove();
        return;
      }

      switch (job.name) {
        // フォルダ単位でサムネイル作成
        case "create-thumbs": {
          if (!dirPath)
            throw new Error("dirPath is required for create-thumbs");

          try {
            console.log(`[Job ${job.id}] Batch Processing: ${dirPath}`);
            const nodes = await listFsNodes(dirPath);

            // 名前順（表示順）に処理するためにソート
            const sorted = sortNodes(nodes);

            // 1. チャンク分けして処理（例: 10枚ずつ）
            const chunks = chunk(sorted, 10);
            let completed = 0;
            for (const chunk of chunks) {
              // サムネイル作成（このチャンク分が完了するまで待つ）
              await createThumbs(chunk, { force: forceCreate });

              // 2. ファイル単位での完了通知を発行
              await Promise.all(
                chunk.map((node) =>
                  connection.publish(
                    "thumb-completed",
                    JSON.stringify({ filePath: node.path })
                  )
                )
              ).catch((err) => console.error("Publish error:", err));

              completed += chunk.length;
              console.log(
                `[Job ${job.id}] Progress: ${completed}/${nodes.length}`
              );
            }

            // 3. 最後にディレクトリ単位での完了通知を発行（念のためのバックアップ）
            await connection.publish(
              "thumb-completed",
              JSON.stringify({ dirPath })
            );

            console.log(`[Job ${job.id}] Notified completion for: ${dirPath}`);
            break;
          } finally {
            if (job.data.lockKey) {
              await connection.del(job.data.lockKey);
            }
          }
        }

        // ファイル単位でサムネイル作成
        case "create-thumb-single": {
          if (!filePath)
            throw new Error("filePath is required for create-thumb-single");

          try {
            console.log(`[Job ${job.id}] Single Processing: ${filePath}`);
            const node = await getFsNode(filePath);
            await createThumbs([node], { force: forceCreate });

            // 完了通知イベントを発行
            await connection.publish(
              "thumb-completed",
              JSON.stringify({ filePath })
            );

            console.log(`[Job ${job.id}] Notified completion for: ${filePath}`);
            break;
          } finally {
            if (job.data.lockKey) {
              await connection.del(job.data.lockKey);
            }
          }
        }

        default:
          console.warn(`Unknown job name: ${job.name}`);
      }
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`[Job ${job?.id}] Failed: ${err.message}`);
  });

  // プロセス終了信号を受け取った時の処理
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, closing worker...`);
    await worker.close(); // 新規ジョブの受付を停止し、実行中のジョブを待つ
    process.exit(0);
  };

  process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
};
