import { defineConfig } from "vite";
import path from "path";
import tailwind from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwind()],
  root: path.join(__dirname, "src"), // Point to src directory
  build: {
    outDir: path.join(__dirname, "dist"), // Output to dist directory
    emptyOutDir: true, // Clean the output directory before each build
    copyPublicDir: true, // Copies over assets
    sourcemap: true, // Enable sourcemaps
  },
});
