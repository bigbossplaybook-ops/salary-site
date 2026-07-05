import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
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
