import { defineConfig } from 'vite'

export default defineConfig({
    clearScreen: false,
    server: {
        port: 1420,
        strictPort: true,
        host: true,
        watch: {
            ignored: ["**/src-tauri/**"],
        },
    },
})
