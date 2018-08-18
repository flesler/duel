/* AUTO GENERATED FILE. DO NOT MODIFY. YOU WILL LOSE YOUR CHANGES ON BUILD. */

export namespace Images {
	export class Background {
		static getName(): string { return 'background' }
		static getPNG(): string { return require('assets/images/background.png') }
	}
}

export namespace Spritesheets {
	export class Alien {
		static getName(): string { return 'alien' }
		static getPNG(): string { return require('assets/spritesheets/alien.[64,64,112,0,0].png') }
		static getFrameWidth(): number { return 64 }
		static getFrameHeight(): number { return 64 }
		static getFrameMax(): number { return 112 }
		static getMargin(): number { return 0 }
		static getSpacing(): number { return 0 }
	}
	export class Fighter {
		static getName(): string { return 'fighter' }
		static getPNG(): string { return require('assets/spritesheets/fighter.[64,64,112,0,0].png') }
		static getFrameWidth(): number { return 64 }
		static getFrameHeight(): number { return 64 }
		static getFrameMax(): number { return 112 }
		static getMargin(): number { return 0 }
		static getSpacing(): number { return 0 }
	}
	export class Fighter2 {
		static getName(): string { return 'fighter2' }
		static getPNG(): string { return require('assets/spritesheets/fighter2.[64,64,112,0,0].png') }
		static getFrameWidth(): number { return 64 }
		static getFrameHeight(): number { return 64 }
		static getFrameMax(): number { return 112 }
		static getMargin(): number { return 0 }
		static getSpacing(): number { return 0 }
	}
	export class Monk {
		static getName(): string { return 'monk' }
		static getPNG(): string { return require('assets/spritesheets/monk.[64,64,112,0,0].png') }
		static getFrameWidth(): number { return 64 }
		static getFrameHeight(): number { return 64 }
		static getFrameMax(): number { return 112 }
		static getMargin(): number { return 0 }
		static getSpacing(): number { return 0 }
	}
	export class Robot {
		static getName(): string { return 'robot' }
		static getPNG(): string { return require('assets/spritesheets/robot.[64,64,112,0,0].png') }
		static getFrameWidth(): number { return 64 }
		static getFrameHeight(): number { return 64 }
		static getFrameMax(): number { return 112 }
		static getMargin(): number { return 0 }
		static getSpacing(): number { return 0 }
	}
}

export namespace Atlases {
	enum PreloadSpritesFrames {
		PreloadBar = <any>'preload_bar.png',
		PreloadFrame = <any>'preload_frame.png',
	}
	export class PreloadSprites {
		static getName(): string { return 'preload_sprites' }

		static getJSONHash(): string { return require('assets/atlases/preload_sprites.json') }

		static getPNG(): string { return require('assets/atlases/preload_sprites.png') }

		static Frames = PreloadSpritesFrames
	}
}

export namespace Audio {
	class Empty {}
}

export namespace Audiosprites {
	class Empty {}
}

export namespace GoogleWebFonts {
	class Empty {}
}

export namespace CustomWebFonts {
	class Empty {}
}

export namespace BitmapFonts {
	export class $04b03 {
		static getName(): string { return '04b03' }

		static getFNT(): string { return require('assets/fonts/04b03.fnt') }
		static getPNG(): string { return require('assets/fonts/04b03.png') }
	}
}

export namespace JSON {
	class Empty {}
}

export namespace Text {
	class Empty {}
}

export namespace Scripts {
	class Empty {}
}
export namespace Misc {
	class Empty {}
}
