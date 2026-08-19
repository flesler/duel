import Phaser from 'phaser'
import * as config from './config'
import Boot from './states/Boot'
import Preloader from './states/Preloader'
import Select from './states/Select'
import Fight from './states/Fight'

declare global {
	var duelGame: Phaser.Game
}

const { WEBGL, CANVAS, Scale } = Phaser

const game = new Phaser.Game({
	parent: 'game',
	width: config.GameWidth,
	height: config.GameHeight,
	transparent: true,
	render: (window as any).devicePixelRatio > 1 ? WEBGL : CANVAS,
	physics: {
		default: 'arcade',
		arcade: { debug: false }
	},
	scale: {
		mode: Scale.RESIZE,
		autoCenter: Scale.CENTER_BOTH
	},
	scene: [Boot, Preloader, Select, Fight]
})

export default game