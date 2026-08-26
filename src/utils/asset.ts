import Phaser from 'phaser'
import * as Assets from '../assets'
import { assetClasses, atlasDataType, atlasDataUrl, audioUrls, bitmapFontDataUrl, imageUrl } from './assetHelpers'

export class Loader {
	private static soundKeys: string[] = []
	private static soundExtensionsPreference: string[] = SOUND_EXTENSIONS_PREFERENCE

	private static orderAudioSourceArrayBasedOnSoundExtensionPreference(soundSourceArray: string[]): string[] {
		let orderedSoundSourceArray: string[] = []
		for (const e in this.soundExtensionsPreference) {
			const sourcesWithExtension = soundSourceArray.filter((el) => {
				return el.substring(el.lastIndexOf('.') + 1, el.length) === this.soundExtensionsPreference[e]
			})
			orderedSoundSourceArray = orderedSoundSourceArray.concat(sourcesWithExtension)
		}
		return orderedSoundSourceArray
	}

	private static loadImages(scene: Phaser.Scene) {
		for (const asset of assetClasses(Assets.Images)) {
			const name = asset.getName()
			const url = imageUrl(asset)
			if (!url || scene.textures.exists(name)) {
				continue
			}
			scene.load.image(name, url)
		}
	}

	private static loadSpritesheets(scene: Phaser.Scene) {
		for (const asset of assetClasses(Assets.Spritesheets)) {
			const name = asset.getName()
			const url = imageUrl(asset)
			if (!url || scene.textures.exists(name)) {
				continue
			}
			scene.load.spritesheet(name, url, {
				frameWidth: (asset.getFrameWidth as () => number)(),
				frameHeight: (asset.getFrameHeight as () => number)(),
				endFrame: (asset.getFrameMax as () => number)() - 1,
				margin: (asset.getMargin as () => number)(),
				spacing: (asset.getSpacing as () => number)(),
			})
		}
	}

	private static loadAtlases(scene: Phaser.Scene) {
		for (const asset of assetClasses(Assets.Atlases)) {
			const name = asset.getName()
			const image = imageUrl(asset)
			const data = atlasDataUrl(asset)
			const type = atlasDataType(asset)
			if (!image || !data || !type || scene.textures.exists(name)) {
				continue
			}
			if (type === 'xml') {
				scene.load.atlasXML(name, image, data)
			} else if (type === 'jsonArray') {
				scene.load.atlas(name, image, data)
			} else {
				scene.load.atlas(name, image, data)
			}
		}
	}

	private static loadAudio(scene: Phaser.Scene) {
		for (const asset of assetClasses(Assets.Audio)) {
			const soundName = asset.getName()
			this.soundKeys.push(soundName)
			if (scene.cache.audio.exists(soundName)) {
				continue
			}
			const sources = this.orderAudioSourceArrayBasedOnSoundExtensionPreference(audioUrls(asset))
			if (sources.length === 0) {
				continue
			}
			scene.load.audio(soundName, sources)
		}
	}

	private static loadAudiosprites(scene: Phaser.Scene) {
		for (const asset of assetClasses(Assets.Audiosprites)) {
			if (typeof asset.getJSON !== 'function') {
				continue
			}
			const soundName = asset.getName()
			this.soundKeys.push(soundName)
			if (scene.cache.audio.exists(soundName)) {
				continue
			}
			const sources = this.orderAudioSourceArrayBasedOnSoundExtensionPreference(audioUrls(asset))
			if (sources.length === 0) {
				continue
			}
			scene.load.audioSprite(soundName, (asset.getJSON as () => string)(), sources)
		}
	}

	private static loadBitmapFonts(scene: Phaser.Scene) {
		for (const asset of assetClasses(Assets.BitmapFonts)) {
			const name = asset.getName()
			const image = imageUrl(asset)
			const data = bitmapFontDataUrl(asset)
			if (!image || !data || scene.cache.bitmapFont.exists(name)) {
				continue
			}
			scene.load.bitmapFont(name, image, data)
		}
	}

	private static loadJSON(scene: Phaser.Scene) {
		for (const asset of assetClasses(Assets.JSON)) {
			if (typeof asset.getJSON !== 'function') {
				continue
			}
			const name = asset.getName()
			if (scene.cache.json.exists(name)) {
				continue
			}
			scene.load.json(name, (asset.getJSON as () => string)())
		}
	}

	private static loadText(scene: Phaser.Scene) {
		for (const asset of assetClasses(Assets.Text)) {
			if (typeof asset.getText !== 'function') {
				continue
			}
			const name = asset.getName()
			if (scene.cache.text.exists(name)) {
				continue
			}
			scene.load.text(name, (asset.getText as () => string)())
		}
	}

	private static loadScripts(scene: Phaser.Scene) {
		for (const asset of assetClasses(Assets.Scripts)) {
			if (typeof asset.getJS !== 'function') {
				continue
			}
			scene.load.script(asset.getName(), (asset.getJS as () => string)())
		}
	}

	public static loadAllAssets(scene: Phaser.Scene, onComplete?: () => void) {
		if (onComplete) {
			scene.load.once('complete', onComplete)
		}
		this.loadImages(scene)
		this.loadSpritesheets(scene)
		this.loadAtlases(scene)
		this.loadAudio(scene)
		this.loadAudiosprites(scene)
		this.loadBitmapFonts(scene)
		this.loadJSON(scene)
		this.loadText(scene)
		this.loadScripts(scene)
	}

	public static waitForSoundDecoding(scene: Phaser.Scene, onComplete: () => void) {
		const pending = this.soundKeys.filter(key => !scene.cache.audio.exists(key))
		if (pending.length === 0) {
			onComplete()
			return
		}
		scene.sound.once(Phaser.Sound.Events.DECODED_ALL, onComplete)
	}
}
