import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/plugins/mcp-app/viewer.ts"],
  format: ["iife"],
  platform: "browser",
  outDir: "dist/plugins/mcp-app/ui",
  noExternal: [/.*/],
  minify: true,
  splitting: false,
});
