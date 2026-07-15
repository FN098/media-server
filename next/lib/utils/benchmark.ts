type TestCase = {
  name: string;
  callback: () => Promise<void> | (() => void);
};

export async function benchmark(
  title = "Performance Test",
  cases: TestCase[]
): Promise<void> {
  console.log(`--- ${title} ---`);

  for (const [i, c] of cases.entries()) {
    const start = performance.now();
    await c.callback();
    const end = performance.now();
    console.log(`${c.name ?? `case${i}`}: ${(end - start).toFixed(3)} ms`);
  }

  console.log("--------------------------------------------------");
}
