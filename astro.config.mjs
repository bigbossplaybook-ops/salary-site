import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://salary-site-49i.pages.dev",
  build: {
    format: "file",
  },
  vite: {
    build: {
      minify: true,
    },
  },
});
