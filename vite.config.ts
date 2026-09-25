import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const railRadarKey = env.RAILRADAR_API_KEY;

  return {
    plugins: [react()],
    // The browser calls this local path; Vite adds the secret Bearer token only
    // while proxying the request, so the key is never exposed to the client.
    server: railRadarKey ? {
      proxy: {
        '/railradar-api': {
          target: 'https://api.railradar.in',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/railradar-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `Bearer ${railRadarKey}`);
            });
          },
        },
      },
    } : undefined,
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['qrcode'],
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'chart-vendor': ['chart.js', 'react-chartjs-2'],
            'pdf-vendor': ['jspdf', 'html2canvas', 'qrcode'],
          },
        },
      },
    },
  };
});
