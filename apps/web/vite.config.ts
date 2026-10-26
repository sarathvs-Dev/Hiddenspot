import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The shared workspace package is consumed as TypeScript source; Vite compiles it directly.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: false },
  preview: { port: 4173 },
});
