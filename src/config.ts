/** Green safe zone inside `assets/images/background.png` (16:10 gameplay). */
export const GameWidth = 900
export const GameHeight = 550

/** Full background art size — canvas and scale base use this aspect ratio. */
export const BgWidth = 924
export const BgHeight = 565

export const SafeOffsetX = (BgWidth - GameWidth) / 2
export const SafeOffsetY = (BgHeight - GameHeight) / 2

export const MaxGameWidth = GameWidth
export const MaxGameHeight = GameHeight

export const ScaleMode = 'SHOW_ALL'

export const Resolution = 1

export const MultiTouchSupport = false

export const TILES = 10
export const TILE_WIDTH = Math.floor(GameWidth / TILES)
