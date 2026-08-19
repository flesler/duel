// Shared build flags, read by both scripts/generate_assets_data.ts and tsup.config.ts
export default {
	// Array of Google Font names to load (empty = none); the generator treats a non-empty value as "use custom web fonts"
	GOOGLE_WEB_FONTS: [] as string[],
	// Order in which audio extensions are tried at runtime; re-order to change preference
	SOUND_EXTENSIONS_PREFERENCE: ['ogg', 'mp3'] as string[],
}