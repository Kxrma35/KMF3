import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // or your specific framework plugin

export default defineConfig({
  plugins: [react()],
  // Add this build section:
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // This pushes all your external libraries into a separate file 
            // called 'vendor', keeping your app code small and fast.
            return 'vendor';
          }
        },
      },
    },
  },
})