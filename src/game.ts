import * as WebFontLoader from 'webfontloader'

import { CustomWebFonts } from './assets'
import { GameWidth, GameHeight, Resolution } from './config'

// States
import Boot from './states/Boot'
import Preloader from './states/Preloader'
import Fight from './states/Fight'

const game = new Phaser.Game({
	width: GameWidth,
	height: GameHeight,
	renderer: Phaser.AUTO,
	parent: '',
	resolution: Resolution,
	backgroundColor: Phaser.Color.BLACK
})
game.forceSingleUpdate = true

game.state.add('Boot', Boot)
game.state.add('Preloader', Preloader)
game.state.add('Fight', Fight)

export default game

function start() {
	game.state.start('Boot')
}

window.onload = () => {
	let webFontLoaderOptions: any = null
	let webFontsToLoad: string[] = GOOGLE_WEB_FONTS

	if (webFontsToLoad.length > 0) {
		webFontLoaderOptions = (webFontLoaderOptions || {})

		webFontLoaderOptions.google = {
			families: webFontsToLoad
		}
	}

	if (Object.keys(CustomWebFonts).length > 0) {
		webFontLoaderOptions = (webFontLoaderOptions || {})

		webFontLoaderOptions.custom = {
			families: [],
			urls: []
		}

		for (let font in CustomWebFonts) {
			webFontLoaderOptions.custom.families.push(CustomWebFonts[font].getFamily())
			webFontLoaderOptions.custom.urls.push(CustomWebFonts[font].getCSS())
		}
	}

	if (webFontLoaderOptions === null) {
		start()
	} else {
		webFontLoaderOptions.active = start
		WebFontLoader.load(webFontLoaderOptions)
	}
}
