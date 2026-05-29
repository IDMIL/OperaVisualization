import { defineConfig } from "vite";

export default defineConfig({
    root: ".",
    base: './', // Add this line to set the base path to relative
    build: {
      rollupOptions: {
          input: {
              main: 'index.html',
              // Add other HTML files here
              french: 'fr.html',
              english: 'en.html',
              german: 'de.html',
              portuguese: 'pt.html'
          },
      },
    outDir: "dist",
  },
});
