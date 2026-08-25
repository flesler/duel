import type Phaser from 'phaser'

const runtime = (globalThis as { Phaser?: typeof Phaser }).Phaser
if (!runtime) {
	throw new Error('Phaser not loaded — include phaser.min.js before game.js')
}
export default runtime
