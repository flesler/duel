/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vitest/config'
import type { TestModule } from 'vitest/node'
import type { Reporter } from 'vitest/reporters'

const root = import.meta.dirname
const APP_NAME = path.basename(root)

function pickReporter(): Reporter | 'dot' | 'verbose' {
	if (process.env.MINIMAL === '1') {
		return new CompactReporter()
	}
	if (process.env.VERBOSE === '1') {
		return 'verbose'
	}
	return 'dot'
}

export default defineConfig({
	cacheDir: `/tmp/${APP_NAME}`,
	test: {
		passWithNoTests: true,
		environment: 'node',
		include: ['src/**/*.test.ts', 'bin/**/*.test.ts'],
		exclude: ['node_modules', 'dist', 'public', 'src/test/**'],
		setupFiles: ['src/test/setup.test.ts'],
		reporters: [pickReporter()],
		logHeapUsage: false,
		disableConsoleIntercept: true,
		onStackTrace: () => false,
		pool: 'threads',
		coverage: { enabled: false },
		typecheck: { enabled: false },
	},
	resolve: {
		alias: {
			src: path.resolve(root, 'src'),
			phaser: path.resolve(root, 'src/phaser-shim.ts'),
		},
	},
})

class CompactReporter implements Reporter {
	onTestRunEnd(testModules: ReadonlyArray<TestModule>) {
		let totalTests = 0
		let failedTests = 0
		for (const module of testModules) {
			for (const test of module.children.allTests()) {
				totalTests++
				const result = test.result()
				if (result.state === 'failed') {
					failedTests++
					console.log(`❌ ${test.name}`)
					const err = result.errors?.[0]
					if (err) {
						console.log(`  ${err.message.split('\n')[0]}`)
					}
				}
			}
		}
		console.log(`\n${failedTests > 0 ? '❌' : '✅'} ${totalTests - failedTests} passed, ${failedTests} failed`)
	}
}
