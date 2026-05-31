import { prisma } from "@/lib/db/prisma";
import { MediaDbNode } from "@/lib/media/types";

// Explorer | Trash ページで対象のディレクトリに存在するファイルの詳細データ取得
export async function getMediaDbNodes(
  dirPath: string,
  userId: string
): Promise<MediaDbNode[]> {
  const dbMedia = await prisma.media.findMany({
    where: { dirPath },
    select: {
      id: true,
      path: true,
      previewPath: true,
      title: true,
      fileMtime: true,
      fileSize: true,
      favorites: {
        where: { userId },
        select: { rating: true, createdAt: true },
      },
      mediaTags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return dbMedia.map((m) => ({
    id: m.id,
    path: m.path,
    previewPath: m.previewPath ?? null,
    title: m.title ?? null,
    fileMtime: m.fileMtime,
    fileSize: Number(m.fileSize),
    rating: m.favorites[0]?.rating ?? null,
    favoritedAt: m.favorites[0]?.createdAt,
    tags: m.mediaTags.map((t) => ({
      id: t.tag.id,
      name: t.tag.name,
    })),
  }));
}

// ファイルパスからメディアIDを逆引き
export async function getMediaIdByPath(path: string): Promise<string | null> {
  const media = await prisma.media.findFirst({
    where: { path },
    select: { id: true },
  });
  return media ? media.id : null;
}

// ファイルパスからメディアIDを逆引き（複数）
export async function getMediaIdsByPaths(
  paths: string[]
): Promise<Record<string, string>> {
  const medias = await prisma.media.findMany({
    where: { path: { in: paths } },
    select: { id: true, path: true },
  });
  return medias.reduce(
    (acc, media) => {
      acc[media.path] = media.id;
      return acc;
    },
    {} as Record<string, string>
  );
}

// ファイル単体のDBレコード＋タグを複製
/** @experimental */
export async function cloneMediaRecord(
  srcVirtualPath: string,
  destVirtualPath: string
) {
  const srcMedia = await prisma.media.findUnique({
    select: {
      fileMtime: true,
      fileSize: true,
      title: true,
      type: true,
      mediaTags: true,
    },
    where: { path: srcVirtualPath },
  });

  // DB未登録ファイルはスキップ（エラーにしない）
  if (!srcMedia) return;

  const { mediaTags, ...rest } = srcMedia;

  const destDirPath = destVirtualPath.split("/").slice(0, -1).join("/");

  await prisma.media.create({
    data: {
      ...rest,
      path: destVirtualPath,
      dirPath: destDirPath,
      ...(mediaTags.length > 0 && {
        mediaTags: {
          create: mediaTags.map(({ tagId }) => ({ tagId })),
        },
      }),
    },
  });
}

// ディレクトリ配下を再帰的に複製
/** @experimental */
export async function cloneMediaRecordsUnderDir(
  srcDirVirtualPath: string,
  destDirVirtualPath: string
) {
  // srcDirVirtualPath 以下の全Mediaを取得
  // path LIKE 'src/%' または path = 'src' に該当するもの
  const prefix = srcDirVirtualPath === "" ? "" : srcDirVirtualPath + "/";
  const records = await prisma.media.findMany({
    select: {
      path: true,
      fileMtime: true,
      fileSize: true,
      title: true,
      type: true,
      mediaTags: true,
    },
    where: {
      OR: [{ dirPath: srcDirVirtualPath }, { dirPath: { startsWith: prefix } }],
    },
  });

  if (records.length === 0) return;

  await prisma.$transaction(
    records.map((srcMedia) => {
      const { mediaTags, ...rest } = srcMedia;

      // src プレフィックスを dest に付け替え
      const relPath = srcMedia.path.slice(srcDirVirtualPath.length); // e.g. "/foo/bar.mp4"
      const destPath = destDirVirtualPath + relPath;
      const destDirPath = destPath.split("/").slice(0, -1).join("/");

      return prisma.media.create({
        data: {
          ...rest,
          path: destPath,
          dirPath: destDirPath,
          ...(mediaTags.length > 0 && {
            mediaTags: {
              create: mediaTags.map(({ tagId }) => ({ tagId })),
            },
          }),
        },
      });
    })
  );
}
