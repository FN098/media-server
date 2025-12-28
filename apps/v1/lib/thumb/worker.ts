import { getMediaFsNode, getMediaFsNodes } from "@/lib/media/fs";
import { createThumbsIfNotExists } from "@/lib/thumb/create";
import { ThumbJobData } from "@/lib/thumb/types";
import { Worker } from "bullmq";
import { connection } from "./queue";

export const startThumbWorker = () => {
  console.log("🚀 Worker process started");

  const worker = new Worker<ThumbJobData>(
    "thumbs",
    async (job) => {
      // ジョブ名で分岐
      switch (job.name) {
        case "create-thumbs": {
          const { dirPath } = job.data;
          if (!dirPath)
            throw new Error("dirPath is required for create-thumbs");

          console.log(`[Job ${job.id}] Batch Processing: ${dirPath}`);
          const nodes = await getMediaFsNodes(dirPath);
          await createThumbsIfNotExists(nodes);

          // サムネイル生成が終わったことを通知
          await connection.publish(
            "thumb-completed",
            JSON.stringify({ dirPath })
          );

          console.log(`[Job ${job.id}] Notified completion for: ${dirPath}`);
          break;
        }

        case "create-thumb-single": {
          const { filePath } = job.data;
          if (!filePath)
            throw new Error("filePath is required for create-thumb-single");

          console.log(`[Job ${job.id}] Single Processing: ${filePath}`);
          const node = await getMediaFsNode(filePath);
          await createThumbsIfNotExists([node]);

          // サムネイル生成が終わったことを通知
          await connection.publish(
            "thumb-completed",
            JSON.stringify({ filePath })
          );

          console.log(`[Job ${job.id}] Notified completion for: ${filePath}`);
          break;
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
