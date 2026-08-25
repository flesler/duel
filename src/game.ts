import * as WebFontLoader from 'webfontloader'
import Phaser from 'phaser'
import { CustomWebFonts } from './assets'
import { GameWidth, GameHeight } from './config'
import Boot from './states/Boot'
import Preloader from './states/Preloader'
import Select from './states/Select'
import Fight from './states/Fight'

function startGame() {
	new Phaser.Game({
		type: Phaser.AUTO,
		parent: 'game',
		width: GameWidth,
		height: GameHeight,
		backgroundColor: '#000000',
		render: {
			pixelArt: true,
			antialias: false,
			roundPixels: true,
		},
		scale: {
			mode: Phaser.Scale.RESIZE,
			autoCenter: Phaser.Scale.CENTER_BOTH,
		},
		physics: {
			default: 'arcade',
			arcade: { debug: false },
		},
		scene: [Boot, Preloader, Select, Fight],
	})
}

window.onload = () => {
	let webFontLoaderOptions: WebFontLoader.Config | null = null
	const webFontsToLoad: string[] = GOOGLE_WEB_FONTS

	if (webFontsToLoad.length > 0) {
		webFontLoaderOptions = webFontLoaderOptions || {}
		webFontLoaderOptions.google = { families: webFontsToLoad }
	}

	if (Object.keys(CustomWebFonts).length > 0) {
		webFontLoaderOptions = webFontLoaderOptions || {}
		webFontLoaderOptions.custom = { families: [], urls: [] }
		for (const font in CustomWebFonts) {
			webFontLoaderOptions.custom.families.push(CustomWebFonts[font].getFamily())
			webFontLoaderOptions.custom.urls.push(CustomWebFonts[font].getCSS())
		}
	}

	if (webFontLoaderOptions === null) {
		startGame()
	} else {
		webFontLoaderOptions.active = startGame
		WebFontLoader.load(webFontLoaderOptions)
	}
}

export default null
