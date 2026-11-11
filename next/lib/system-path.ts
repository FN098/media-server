export const SYSTEM_PATHS = [".thumb", ".db"] as const;

type SystemPath = (typeof SYSTEM_PATHS)[number];

export function isSystemPath(path: string): path is SystemPath {
  return SYSTEM_PATHS.includes(path as SystemPath);
}
