/**
 * メディアタイプ修正
 *
 * Media.type が未設定の行に対し、type の値を更新する。
 *
 * 使い方：`pnpm tsx ./tools/update-media-types.ts`
 */

import { detectMediaType, mediaTypes } from "@/lib/media/detectors";
import { MediaType } from "@/lib/media/types";
import { prisma } from "@/lib/prisma";

export async function bulkUpdateMediaTypes() {
  try {
    // 1. 判定が必要なレコードを全件取得
    const allMedia = await prisma.media.findMany({
      select: {
        id: true,
        path: true,
      },
      where: { type: null },
    });

    if (allMedia.length === 0) {
      return { success: true, message: "処理対象のレコードはありません。" };
    }

    // 2. MediaType ごとに ID を分類
    const idsByType: Record<MediaType, string[]> = {
      image: [],
      video: [],
      audio: [],
    };

    for (const media of allMedia) {
      const detectedType = detectMediaType(media.path);
      if (detectedType) {
        idsByType[detectedType].push(media.id);
      }
    }

    console.log(`更新の準備が整いました: 
      - Image: ${idsByType.image.length}件
      - Video: ${idsByType.video.length}件
      - Audio: ${idsByType.audio.length}件`);

    // 3. updateMany で一括更新を実行
    const updatePromises = mediaTypes.map((type) => {
      const ids = idsByType[type];
      if (ids.length === 0) return null;

      return prisma.media.updateMany({
        where: {
          id: { in: ids },
        },
        data: {
          type,
        },
      });
    });

    // null を除外して並列実行
    const results = await Promise.all(updatePromises.filter((p) => !!p));
    const totalUpdated = results.reduce(
      (acc, res) => acc + (res?.count || 0),
      0
    );

    return {
      success: true,
      message: `一括更新が完了しました。計 ${totalUpdated} 件のレコードを更新しました。`,
    };
  } catch (error) {
    console.error("Bulk update error:", error);
    return { success: false, error: "一括更新中にエラーが発生しました。" };
  } finally {
    await prisma.$disconnect();
  }
}

bulkUpdateMediaTypes().then(console.log).catch(console.error);
