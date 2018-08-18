import * as utils from '../utils'
import { Atlases, Images, Spritesheets } from '../assets'
import { GameWidth, GameHeight, ScaleMode, MultiTouchSupport } from '../config'

const { PreloadSprites } = Atlases
const { Background } = Images

export default class Boot extends Phaser.State {
	public preload(): void {
		this.game.load.atlasJSONHash(PreloadSprites.getName(), PreloadSprites.getPNG(), PreloadSprites.getJSONHash())
		this.game.load.image(Background.getName(), Background.getPNG())

		for (const sheet of utils.values(Spritesheets)) {
			this.game.load.spritesheet(sheet.getName(), sheet.getPNG(), sheet.getFrameWidth(), sheet.getFrameHeight(), sheet.getFrameMax(), sheet.getMargin(), sheet.getSpacing())
		}
	}

	private loadSheet(sheet: any) {
	}

	public create(): void {
		if (!MultiTouchSupport) {
			this.input.maxPointers = 1
		}

		this.game.scale.scaleMode = Phaser.ScaleManager[ScaleMode]

		this.game.scale.pageAlignHorizontally = true
		this.game.scale.pageAlignVertically = true

		if (this.game.device.desktop) {
			// Any desktop specific stuff here
		}
		else {
			// Any mobile specific stuff here

			const is_landscape = (GameWidth > GameHeight)
			this.game.scale.forceOrientation(is_landscape, !is_landscape)
		}

		this.game.state.start('Preloader')
	}
}
