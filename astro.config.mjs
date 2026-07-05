import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "static",
  adapter: cloudflare(),
  site: "https://salary-site.pages.dev",
  build: {
    format: "directory",
  },
  vite: {
    build: {
      minify: true,
    },
  },
});
