export function assertNever(x: unknown): never {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}
