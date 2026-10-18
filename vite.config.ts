import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // 상대 경로로 빌드해야 GitHub Pages처럼 하위 경로에 올려도 동작한다.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        // 앱 고유 식별자. 안드로이드 앱(TWA)으로 만들 때 같은 앱임을 구분하는 기준이라 바꾸지 않는다.
        id: '/3line-diary/',
        name: '세줄일기',
        short_name: '세줄일기',
        description: '사진 한 장과 세 줄로 남기는 하루',
        lang: 'ko',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['lifestyle', 'productivity'],
        background_color: '#faf7f2',
        theme_color: '#faf7f2',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // 개인정보처리방침은 앱 화면(index.html)으로 대체되지 않고 그대로 열려야 한다.
        navigateFallbackDenylist: [/privacy\.html$/],
      },
    }),
  ],
  server: {
    host: true,
  },
});
