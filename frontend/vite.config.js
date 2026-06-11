import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Target modern browsers for smaller output
    target: 'es2020',
    // Minimize output with esbuild (built-in, no extra install)
    minify: 'esbuild',
    // No sourcemaps in production
    sourcemap: false,
    // Chunk splitting for optimal loading
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React — always needed
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Recharts — only needed in Dashboard (lazy loaded)
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // Framer Motion — only needed in Dashboard
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // React Markdown — only needed in Dashboard
          if (id.includes('node_modules/react-markdown') || id.includes('node_modules/remark-') || id.includes('node_modules/rehype-') || id.includes('node_modules/unified') || id.includes('node_modules/mdast-') || id.includes('node_modules/micromark')) {
            return 'vendor-markdown';
          }
          // Lucide icons — used across app but tree-shakeable
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
    // Inline small assets
    assetsInlineLimit: 4096,
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  // Optimize deps for faster dev startup
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', 'sonner', 'clsx', 'tailwind-merge'],
  },
});
