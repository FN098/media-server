import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    // tsconfig.json の paths エイリアスを自動で読み取るプラグイン
    tsconfigPaths(),
  ],
  test: {
    globals: true,
  },
});
