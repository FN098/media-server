export const USER = process.env.BASIC_USER ?? "admin";
export const PASS = process.env.BASIC_PASS ?? "password";
const NAME = "管理者";

type BasicAuthCredentials = {
  user: string;
  pass: string;
};

type BasicAuthUser = {
  id: string;
  name: string;
};

type HeadersLike = {
  get(name: string): string | null;
};

export function parseCredentials(
  headers: HeadersLike
): BasicAuthCredentials | null {
  const authHeader = headers.get("authorization");
  if (!authHeader) return null;

  const [scheme, encoded] = authHeader.split(/\s+/);
  if (scheme !== "Basic" || !encoded) return null;

  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const index = decoded.indexOf(":");
    if (index === -1) return null;

    const user = decoded.slice(0, index);
    const pass = decoded.slice(index + 1);

    if (!user || !pass) return null;

    return { user, pass };
  } catch {
    return null;
  }
}

export function authenticate({
  user,
  pass,
}: BasicAuthCredentials): BasicAuthUser | null {
  if (user === USER && pass === PASS) {
    return {
      id: user,
      name: NAME,
    };
  }
  return null;
}
