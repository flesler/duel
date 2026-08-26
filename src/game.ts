import * as WebFontLoader from 'webfontloader'
import Phaser from 'phaser'
import { customFonts } from './boot/fonts'
import { BgWidth, BgHeight } from './config'
import Boot from './states/Boot'
import Preloader from './states/Preloader'
import Select from './states/Select'
import Fight from './states/Fight'

function startGame() {
	new Phaser.Game({
		type: Phaser.AUTO,
		parent: 'game',
		width: BgWidth,
		height: BgHeight,
		backgroundColor: '#000000',
		render: {
			pixelArt: true,
			antialias: false,
			roundPixels: true,
		},
		scale: {
			mode: Phaser.Scale.FIT,
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
	const fonts = customFonts()

	if (webFontsToLoad.length > 0) {
		webFontLoaderOptions = webFontLoaderOptions || {}
		webFontLoaderOptions.google = { families: webFontsToLoad }
	}

	if (fonts.length > 0) {
		webFontLoaderOptions = webFontLoaderOptions || {}
		webFontLoaderOptions.custom = {
			families: fonts.map(font => font.getFamily()),
			urls: fonts.map(font => font.getCSS()),
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
