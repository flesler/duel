#!/usr/bin/env tsx
/**
 * Plan-B browser smoke: HTTP asset checks + headless Chrome CDP canvas probe.
 *
 * Usage:
 *   npm run smoke:browser
 *   npm run smoke:browser -- --url http://localhost:4000 --skip-cdp
 *
 * Requires `npm run serve` (or any static host) unless --skip-cdp with prebuilt public/.
 */
import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { createConnection } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'

type Check = { name: string; ok: boolean; detail?: string }

const DEFAULT_URL = 'http://localhost:4000'
const BG_W = 924
const BG_H = 565

function parseArgs(argv: string[]) {
	let url = DEFAULT_URL
	let skipCdp = false
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === '--url' && argv[i + 1]) {
			url = argv[++i]
		}
		if (argv[i] === '--skip-cdp') {
			skipCdp = true
		}
	}
	return { url, skipCdp }
}

async function portOpen(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const socket = createConnection({ port, host: '127.0.0.1' })
		socket.once('connect', () => {
			socket.end()
			resolve(true)
		})
		socket.once('error', () => resolve(false))
	})
}

async function httpCheck(url: string): Promise<Check> {
	try {
		const res = await fetch(url, { redirect: 'follow' })
		const ok = res.ok
		return { name: `GET ${url}`, ok, detail: `status ${res.status}` }
	} catch (e) {
		return { name: `GET ${url}`, ok: false, detail: String(e) }
	}
}

async function runHttpChecks(base: string): Promise<Check[]> {
	const paths = ['/', '/dist/game.js']
	const checks: Check[] = []
	for (const path of paths) {
		checks.push(await httpCheck(new URL(path, base).href))
	}
	return checks
}

async function cdpEvaluate(port: number, pageUrl: string, expression: string): Promise<unknown> {
	const { default: WebSocket } = await import('ws')
	const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json()) as { webSocketDebuggerUrl: string }[]
	const page = targets.find(t => (t as { type?: string }).type === 'page')
	if (!page) {
		throw new Error('no CDP page target')
	}
	const ws = new WebSocket(page.webSocketDebuggerUrl)
	let id = 0
	const pending = new Map<number, (msg: Record<string, unknown>) => void>()
	ws.on('message', (raw) => {
		const msg = JSON.parse(String(raw)) as { id?: number }
		if (msg.id && pending.has(msg.id)) {
			pending.get(msg.id)!(msg)
		}
	})
	await new Promise<void>((res, rej) => {
		ws.once('open', () => res())
		ws.once('error', rej)
	})
	const send = (method: string, params: Record<string, unknown> = {}) => new Promise<Record<string, unknown>>((res) => {
		const my = ++id
		pending.set(my, res)
		ws.send(JSON.stringify({ id: my, method, params }))
	})
	await send('Runtime.enable')
	await send('Page.navigate', { url: pageUrl })
	await delay(5000)
	for (const ev of [
		{ type: 'keyDown', key: ' ', code: 'Space' },
		{ type: 'keyUp', key: ' ', code: 'Space' },
		{ type: 'keyDown', key: 'Enter', code: 'Enter' },
		{ type: 'keyUp', key: 'Enter', code: 'Enter' },
	]) {
		await send('Input.dispatchKeyEvent', ev)
		await delay(150)
	}
	await delay(2500)
	const out = await send('Runtime.evaluate', { expression, returnByValue: true })
	ws.close()
	const nested = out.result as { value?: unknown; result?: { value?: unknown } }
	return nested?.value ?? nested?.result?.value
}

async function runCdpChecks(chromePath: string, url: string): Promise<Check[]> {
	const port = 9333
	const proc = spawn(chromePath, [
		'--headless=new',
		'--disable-gpu',
		'--window-size=1280,800',
		`--remote-debugging-port=${port}`,
		'--remote-allow-origins=*',
		'about:blank',
	], { stdio: 'ignore' })
	await delay(1000)
	try {
		const expr = `(() => {
			const c = document.querySelector('canvas');
			if (!c) return { ok: false, reason: 'no canvas' };
			const rect = c.getBoundingClientRect();
			const expected = ${BG_W} / ${BG_H};
			const aspect = rect.width / rect.height;
			return {
				ok: c.width === ${BG_W} && c.height === ${BG_H} && Math.abs(aspect - expected) < 0.02,
				buffer: { w: c.width, h: c.height },
				css: { w: rect.width, h: rect.height, aspect },
				expected,
			};
		})()`
		const value = await cdpEvaluate(port, url, expr) as { ok?: boolean; reason?: string; buffer?: unknown }
		return [{
			name: 'cdp canvas aspect',
			ok: !!value?.ok,
			detail: value?.reason ?? JSON.stringify(value),
		}]
	} finally {
		proc.kill('SIGTERM')
	}
}

async function resolveChrome(): Promise<string | null> {
	for (const path of ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
		try {
			await access(path)
			return path
		} catch {
			// try next
		}
	}
	return null
}

async function main() {
	const { url, skipCdp } = parseArgs(process.argv.slice(2))
	const checks = await runHttpChecks(url)

	if (!skipCdp) {
		const port = Number(new URL(url).port || 80)
		if (!(await portOpen(port))) {
			checks.push({ name: 'serve reachable', ok: false, detail: `nothing on port ${port}` })
		} else {
			const chrome = await resolveChrome()
			if (!chrome) {
				checks.push({ name: 'cdp', ok: false, detail: 'chrome not found; use --skip-cdp' })
			} else {
				checks.push(...await runCdpChecks(chrome, url))
			}
		}
	}

	const ok = checks.every(c => c.ok)
	const report = { ok, checks }
	console.log(JSON.stringify(report, null, 2))
	process.exit(ok ? 0 : 1)
}

main().catch((err) => {
	console.error(JSON.stringify({ ok: false, error: String(err) }))
	process.exit(1)
})
