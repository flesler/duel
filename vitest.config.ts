import path from 'path'
import { defineConfig } from 'vitest/config'

const APP_NAME = path.basename(__dirname)

export default defineConfig({
	cacheDir: `/tmp/${APP_NAME}`,
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts', 'bin/**/*.test.ts'],
		exclude: ['node_modules', 'dist', 'public', 'src/util/utils.test.ts'],
		reporters: process.env.VERBOSE === '1' ? 'verbose' : 'dot',
		pool: 'threads',
		coverage: { enabled: false },
		typecheck: { enabled: false },
	},
	resolve: {
		alias: {
			src: path.resolve(__dirname, './src'),
			phaser: path.resolve(__dirname, './src/phaser-shim.ts'),
		},
	},
	esbuild: {
		target: 'node18',
	},
})
