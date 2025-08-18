import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  plugins: [
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      customViteReactPlugin: true,
      spa: {
        enabled: true,
        prerender: {
          outputPath: '/index.html',
        },
      },
    }),
    viteReact(),
  ],
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toLocaleDateString('en-CA')),
    __GIT_HASH__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) || 'dev'),
  },
  base: process.env.GITHUB_PAGES === 'true' ? '/TowerOfTracking/' : '/',
})

export default config
