import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production)
  // process.cwd() points to the project root where .env should be
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Allows access from any IP (useful for testing on other devices)
      port: 5173,     // Default Vite port
      // Optional: Proxy API requests to backend during development to avoid CORS issues
      // proxy: {
      //   '/api': { // Requests to /api/* will be forwarded
      //     target: env.VITE_API_BASE_URL || 'http://127.0.0.1:5004', // Your backend server
      //     changeOrigin: true, // Needed for virtual hosted sites
      //     // rewrite: (path) => path.replace(/^\/api/, ''), // Optional: Remove /api prefix if backend doesn't expect it
      //   }
      // }
    },
     // Define environment variables accessible in the client-side code
     // IMPORTANT: Only variables prefixed with VITE_ are exposed!
     define: {
       // 'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL) // Example if needed, but import.meta.env is preferred
     }
  }
})