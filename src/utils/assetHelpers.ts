type AssetClass = {
	getName: () => string;
	[key: string]: unknown
}

const IMAGE_GETTERS = ['getPNG', 'getJPG', 'getJPEG', 'getGIF', 'getWEBP', 'getBMP', 'getSVG'] as const
const AUDIO_GETTERS = ['getOGG', 'getMP3', 'getWAV'] as const

export function isAssetClass(value: unknown): value is AssetClass {
	return typeof (value as AssetClass)?.getName === 'function'
}

export function assetClasses<T extends Record<string, unknown>>(namespace: T): AssetClass[] {
	return Object.values(namespace).filter(isAssetClass)
}

function callGetter<T>(asset: AssetClass, names: readonly string[]): T | null {
	for (const name of names) {
		const fn = asset[name]
		if (typeof fn === 'function') {
			return (fn as () => T)()
		}
	}
	return null
}

export function imageUrl(asset: AssetClass): string | null {
	return callGetter<string>(asset, IMAGE_GETTERS)
}

export function audioUrls(asset: AssetClass): string[] {
	const urls: string[] = []
	for (const name of AUDIO_GETTERS) {
		const fn = asset[name]
		if (typeof fn === 'function') {
			urls.push((fn as () => string)())
		}
	}
	return urls
}

export function atlasDataUrl(asset: AssetClass): string | null {
	return callGetter<string>(asset, ['getJSONHash', 'getJSONArray', 'getXML'])
}

export function atlasDataType(asset: AssetClass): 'jsonHash' | 'jsonArray' | 'xml' | null {
	if (typeof asset.getJSONHash === 'function') {
		return 'jsonHash'
	}
	if (typeof asset.getJSONArray === 'function') {
		return 'jsonArray'
	}
	if (typeof asset.getXML === 'function') {
		return 'xml'
	}
	return null
}

export function bitmapFontDataUrl(asset: AssetClass): string | null {
	return callGetter<string>(asset, ['getFNT', 'getXML'])
}
