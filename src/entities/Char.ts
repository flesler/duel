import game from '../game'
import * as config from '../config'
import * as utils from '../utils'

const DEFAULT_FPS = 8
const SCALE = 1.7

export class Char extends Phaser.Sprite {
	public readonly direction: CharDirection
	private _state: State
	private _tile: number
	private power: Phaser.Sprite

	constructor(key: string, direction: CharDirection) {
		super(game, 0, 0, key)

		this.direction = direction
		this.init()
	}

	private init() {
		this.scale = new Phaser.Point(this.direction * SCALE, SCALE)
		this.anchor.set(0.5, 1)
		this.smoothed = true
		this.setAnimations(this)

		this.power = new Phaser.Sprite(game, 0, 0, this.key as string)
		this.power.anchor = this.anchor
		this.setAnimations(this.power)
		this.addChild(this.power)

		this.health = this.maxHealth = config.MAX_HEALTH
		this.state = CharStates.idle
	}

	private setAnimations(sprite: Phaser.Sprite) {
		for (const key in CharStates) {
			const state: State = CharStates[key]
			sprite.animations.add(key, state.frames, state.fps || DEFAULT_FPS, state.loop)
		}
	}

	private getName(state: State): string {
		for (const key in CharStates) {
			if (CharStates[key] === state) {
				return key
			}
		}
		throw new Error('Unknown State')
	}

	public set tile(v: number) {
		const dest = (v + 0.5) * config.TILE_WIDTH
		if (this.x) {
			game.add.tween(this).to({ x: dest }, 800, Phaser.Easing.Exponential.Out, true).start()
		} else {
			this.x = dest
		}
		this._tile = v
	}

	public get tile() {
		return this._tile
	}

	public get state() {
		return this._state
	}

	public set state(newState: State) {
		if (newState === this._state) {
			return
		}
		if (newState.pick) {
			this.frame = utils.pick(newState.frames)
		} else {
			this.play(this.getName(newState))
		}
		this._state = newState
		if (newState.power) {
			this.power.play('power')
			this.power.visible = true
		} else {
			this.power.animations.stop()
			this.power.visible = false
		}
	}
}

export interface State {
	frames: number[]
	loop?: boolean
	pick?: boolean
	power?: boolean
	fps?: number
}

export const CharStates: { [name: string]: State } = {
	idle: { frames: [1] },
	back: { frames: [18] },
	charge: { frames: [19/*, 20*/] },
	attack: { frames: [36, 37, 38, 37], loop: true },
	dead: { frames: [58, 63, 64, 64, 64, 61], fps: 3 },
	heal: { frames: [16, 17], power: true, fps: 3 },
	block: { frames: [54, 55], pick: true },
	// block: { frames: [81, 82/*, 83*/, 84] },
	hit: { frames: [57, 58, 59], pick: true },
	win: { frames: [1, 4, 5, 40, 41, 41, 40, 1], power: true, fps: 5 },
	power: { frames: [108, 109, 110, 111], loop: true, fps: 12 },
}

export type CharDirection = 1 | -1
