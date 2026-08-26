import { CustomWebFonts } from '../assets'

type FontAsset = { getFamily(): string; getCSS(): string }

export function isFontAsset(value: unknown): value is FontAsset {
	return typeof (value as FontAsset)?.getFamily === 'function'
		&& typeof (value as FontAsset)?.getCSS === 'function'
}

export function customFonts(): FontAsset[] {
	const fonts: FontAsset[] = []
	for (const entry of Object.values(CustomWebFonts)) {
		if (isFontAsset(entry)) {
			fonts.push(entry)
		}
	}
	return fonts
}
