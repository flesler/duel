import Phaser from 'phaser'
import * as Assets from '../assets'

export class Loader {
	private static soundKeys: string[] = []
	private static soundExtensionsPreference: string[] = SOUND_EXTENSIONS_PREFERENCE

	private static loadImages(scene: Phaser.Scene) {
		for (const image in Assets.Images) {
			const asset = Assets.Images[image]
			const name = asset.getName()
			if (!scene.textures.exists(name)) {
				for (const option in asset) {
					if (option !== 'getName') {
						scene.load.image(name, asset[option]())
					}
				}
			}
		}
	}

	private static loadSpritesheets(scene: Phaser.Scene) {
		for (const spritesheet in Assets.Spritesheets) {
			const asset = Assets.Spritesheets[spritesheet]
			const name = asset.getName()
			if (!scene.textures.exists(name)) {
				let imageOption = null
				for (const option in asset) {
					if (option !== 'getName' && option !== 'getFrameWidth' && option !== 'getFrameHeight' && option !== 'getFrameMax' && option !== 'getMargin' && option !== 'getSpacing') {
						imageOption = option
					}
				}
				scene.load.spritesheet(name, asset[imageOption](), {
					frameWidth: asset.getFrameWidth(),
					frameHeight: asset.getFrameHeight(),
					endFrame: asset.getFrameMax() - 1,
					margin: asset.getMargin(),
					spacing: asset.getSpacing(),
				})
			}
		}
	}

	private static loadAtlases(scene: Phaser.Scene) {
		for (const atlas in Assets.Atlases) {
			const asset = Assets.Atlases[atlas]
			const name = asset.getName()
			if (!scene.textures.exists(name)) {
				let imageOption = null
				let dataOption = null
				for (const option in asset) {
					if (option === 'getXML' || option === 'getJSONArray' || option === 'getJSONHash') {
						dataOption = option
					} else if (option !== 'getName' && option !== 'Frames') {
						imageOption = option
					}
				}
				if (dataOption === 'getXML') {
					scene.load.atlasXML(name, asset[imageOption](), asset.getXML())
				} else if (dataOption === 'getJSONArray') {
					scene.load.atlas(name, asset[imageOption](), asset.getJSONArray())
				} else if (dataOption === 'getJSONHash') {
					scene.load.atlas(name, asset[imageOption](), asset.getJSONHash())
				}
			}
		}
	}

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

	private static loadAudio(scene: Phaser.Scene) {
		for (const audio in Assets.Audio) {
			const asset = Assets.Audio[audio]
			const soundName = asset.getName()
			this.soundKeys.push(soundName)
			if (!scene.cache.audio.exists(soundName)) {
				const audioTypeArray: string[] = []
				for (const option in asset) {
					if (option !== 'getName') {
						audioTypeArray.push(asset[option]())
					}
				}
				scene.load.audio(soundName, this.orderAudioSourceArrayBasedOnSoundExtensionPreference(audioTypeArray))
			}
		}
	}

	private static loadAudiosprites(scene: Phaser.Scene) {
		for (const audio in Assets.Audiosprites) {
			const asset = Assets.Audiosprites[audio]
			const soundName = asset.getName()
			this.soundKeys.push(soundName)
			if (!scene.cache.audio.exists(soundName)) {
				const audioTypeArray: string[] = []
				for (const option in asset) {
					if (option !== 'getName' && option !== 'getJSON' && option !== 'Sprites') {
						audioTypeArray.push(asset[option]())
					}
				}
				scene.load.audioSprite(soundName, asset.getJSON(), this.orderAudioSourceArrayBasedOnSoundExtensionPreference(audioTypeArray))
			}
		}
	}

	private static loadBitmapFonts(scene: Phaser.Scene) {
		for (const font in Assets.BitmapFonts) {
			const asset = Assets.BitmapFonts[font]
			const name = asset.getName()
			if (!scene.cache.bitmapFont.exists(name)) {
				let imageOption = null
				let dataOption = null
				for (const option in asset) {
					if (option === 'getXML' || option === 'getFNT') {
						dataOption = option
					} else if (option !== 'getName') {
						imageOption = option
					}
				}
				scene.load.bitmapFont(name, asset[imageOption](), asset[dataOption]())
			}
		}
	}

	private static loadJSON(scene: Phaser.Scene) {
		for (const json in Assets.JSON) {
			const asset = Assets.JSON[json]
			const name = asset.getName()
			if (!scene.cache.json.exists(name)) {
				scene.load.json(name, asset.getJSON())
			}
		}
	}

	private static loadText(scene: Phaser.Scene) {
		for (const text in Assets.Text) {
			const asset = Assets.Text[text]
			const name = asset.getName()
			if (!scene.cache.text.exists(name)) {
				scene.load.text(name, asset.getText())
			}
		}
	}

	private static loadScripts(scene: Phaser.Scene) {
		for (const script in Assets.Scripts) {
			const asset = Assets.Scripts[script]
			scene.load.script(asset.getName(), asset.getJS())
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
		const pending = this.soundKeys.filter((key) => !scene.cache.audio.exists(key))
		if (pending.length === 0) {
			onComplete()
			return
		}
		scene.sound.once(Phaser.Sound.Events.DECODED_ALL, onComplete)
	}
}
