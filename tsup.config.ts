import { existsSync, renameSync } from 'node:fs'
import { defineConfig } from 'tsup'
// Single source of truth for build flags, shared with bin/generate_assets_data.ts
import env from './bin/env.js'

// DIST=1 means production build, otherwise it's dev (matches webpack.dev/dist configs)
const isDist = process.env.DIST === '1'

export default defineConfig((options) => ({
  entry: { game: 'src/game.ts' },
  format: ['iife'],
  // Names the IIFE bundle's exports in global scope
  globalName: 'Duel',
  target: 'es2020',
  outDir: 'dist',
  clean: true,
  minify: isDist && !options.watch,
  sourcemap: true,
  // Replaces webpack DefinePlugin; values come from bin/env.js (edit that file to change them)
  define: {
    DEBUG: String(!isDist),
    GOOGLE_WEB_FONTS: JSON.stringify(env.GOOGLE_WEB_FONTS),
    SOUND_EXTENSIONS_PREFERENCE: JSON.stringify(env.SOUND_EXTENSIONS_PREFERENCE),
  },
  // Replaces webpack file-loader for assets
  loader: {
    '.png': 'file', '.jpg': 'file', '.jpeg': 'file', '.gif': 'file',
    '.webp': 'file', '.svg': 'file', '.bmp': 'file',
    '.ogg': 'file', '.mp3': 'file', '.wav': 'file',
    '.fnt': 'file', '.json': 'file',
  },
  assetNames: 'assets/[name]-[hash]',
  // tsup names IIFE entries '<name>.global.js'; the HTML expects dist/game.js
  onSuccess: () => {
    for (const file of ['game.global.js', 'game.global.js.map']) {
      if (existsSync(`dist/${file}`)) {
        renameSync(`dist/${file}`, `dist/${file.replace('.global', '')}`)
      }
    }
  },
}))