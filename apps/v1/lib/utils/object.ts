export function omit<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> {
  const result = { ...obj };

  for (const key of keys) {
    delete result[key];
  }

  return result;
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }

  return result;
}

/**
 * Object.entries の型付きバージョン。
 *
 * 通常の Object.entries はキーが string に落ちるため、
 * keyof T と value 型の対応関係が失われる。
 *
 * この関数はそれを補い、オブジェクトのキーと値の型を保持したまま
 * entries 配列として扱えるようにする。
 */
export function entries<T extends Record<string, unknown>>(
  obj: T
): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}
