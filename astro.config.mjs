import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://salary-site.pages.dev",
  build: {
    format: "file",
  },
  vite: {
    build: {
      minify: true,
    },
  },
});
