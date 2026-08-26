import { describe, expect, it } from 'vitest'
import { Audiosprites, CustomWebFonts } from '../assets'
import { assetClasses, atlasDataType, audioUrls, imageUrl, isAssetClass } from './assetHelpers'

describe('assetHelpers', () => {
	it('should ignore placeholder Empty classes', () => {
		expect(isAssetClass(Audiosprites.Empty)).toBe(false)
		expect(isAssetClass(CustomWebFonts.Empty)).toBe(false)
		expect(assetClasses(Audiosprites)).toEqual([])
	})

	it('should resolve image URLs from explicit getters', () => {
		expect(imageUrl({
			getName: () => 'alien',
			getPNG: () => 'alien.png',
			prototype: {},
		})).toBe('alien.png')
	})

	it('should not treat class prototype as an image getter', () => {
		const asset = {
			getName: () => 'alien',
			getPNG: () => 'alien.png',
			prototype: {},
		}
		expect(imageUrl(asset)).toBe('alien.png')
	})

	it('should collect audio urls from real assets', () => {
		const urls = audioUrls({ getName: () => 'test', getMP3: () => 'a.mp3', getOGG: () => 'a.ogg' })
		expect(urls).toEqual(['a.ogg', 'a.mp3'])
	})

	it('should detect atlas data type', () => {
		expect(atlasDataType({
			getName: () => 'preload',
			getJSONHash: () => '{}',
			getPNG: () => 'x.png',
		})).toBe('jsonHash')
	})
})
