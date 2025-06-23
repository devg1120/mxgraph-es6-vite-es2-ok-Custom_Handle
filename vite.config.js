import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@mxgraph': resolve(__dirname, 'src')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'mxgraph',
      //fileName: 'mxgraph',
      fileName: (ext) => `mxgraph.${ext}.js`,

    },
  },
})

