import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    svelte(),
    // 서비스 워커는 /sw.js(스코프 /) 그대로 유지해 설치된 PWA가 자연스럽게 새 버전으로 넘어가게 한다
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: false,
      manifest: false,
      injectManifest: { globPatterns: ["**/*.{js,css,html,png,svg,json}"], globIgnores: ["models/**"], maximumFileSizeToCacheInBytes: 6 * 1024 * 1024 },
      devOptions: { enabled: false },
    }),
  ],
  build: { target: "es2022", chunkSizeWarningLimit: 2000 },
});
