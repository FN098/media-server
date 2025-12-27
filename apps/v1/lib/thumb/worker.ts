import { getMediaFsNodes } from "@/lib/media/listing";
import { createThumbsIfNotExists } from "@/lib/thumb/create";
import { ThumbJobData } from "@/lib/thumb/types";
import { Worker } from "bullmq";
import { connection } from "./queue";

export const startThumbWorker = () => {
  console.log("🚀 Worker process started");

  const worker = new Worker<ThumbJobData>(
    "thumbs",
    async (job) => {
      const { dirPath } = job.data;
      console.log(`[Job ${job.id}] Processing: ${dirPath}`);

      const nodes = await getMediaFsNodes(dirPath);
      await createThumbsIfNotExists(nodes);

      console.log(`[Job ${job.id}] Completed`);
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`[Job ${job?.id}] Failed: ${err.message}`);
  });
};
