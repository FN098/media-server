import { redis } from "@/lib/redis";
import { ThumbJobData } from "@/lib/thumb-job/types";
import { processThumbJob } from "@/workers/thumb/processor";
import { Worker } from "bullmq";

export const startThumbWorker = () => {
  console.log("🚀 Thumb worker process started");

  const worker = new Worker<ThumbJobData>("thumbs", processThumbJob, {
    connection: redis,
  });

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
