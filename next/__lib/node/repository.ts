import { prisma } from "@/__lib/prisma";

// ファイルパスからメディアIDを逆引き
/** @deprecated */
export async function getMediaIdByPath(path: string): Promise<string | null> {
  const media = await prisma.media.findFirst({
    where: { path },
    select: { id: true },
  });
  return media ? media.id : null;
}

// ファイルパスからメディアIDを逆引き（複数）
/** @deprecated */
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
/** @experimental @deprecated*/
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
/** @experimental @deprecated*/
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

// ファイル更新日を更新
/** @deprecated */
export async function updateMediaFileMtime({
  path,
  mtime = new Date(),
}: {
  path: string;
  mtime?: Date;
}): Promise<void> {
  await prisma.media.update({
    where: { path },
    data: { fileMtime: mtime },
  });
}
