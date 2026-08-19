import Phaser from 'phaser'
import { Spritesheets } from '../assets'
import game from '../game'
import * as config from '../config'

export enum CharDirection {
	left = -1, right = 1
}

export const CharStates = {
	idle: 'idle', back: 'back', charge: 'charge', attack: 'attack', block: 'block', heal: 'heal', hit: 'hit', win: 'win', dead: 'dead'
}

interface State {
	frames: number[]
	loop?: boolean
	pick?: boolean
	fps?: number
	power?: boolean
}

const CHAR_STATES: { [name: string]: State } = {
	idle: { frames: [1, 2, 3, 4, 3, 2], loop: true, fps: 8 },
	back: { frames: [7, 8, 9, 10, 9, 8] },
	charge: { frames: [11, 12, 13, 14], loop: true, fps: 20 },
	attack: { frames: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24], loop: true, fps: 10 },
	block: { frames: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34], loop: true, fps: 20 },
	heal: { frames: [2, 1], pick: true },
	hit: { frames: [2, 1], pick: true },
	win: { frames: [0], loop: true },
	dead: { frames: [35, 36, 37, 38, 39, 40], fps: 3, power: true },
	power: { frames: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], fps: 20, power: true }
}

export class Char extends Phaser.Physics.Arcade.Sprite {
	public health = config.MAX_HEALTH
	public tile = 0
	public cooldownEnd = 0
	public facing: CharDirection

	protected name: string
	protected lastAction = 0
	protected state: State = null
	protected stateName: string = null

	constructor(name: string, direction: CharDirection) {
		const sheet = Spritesheets[name]
		super(game, 100, 100, sheet.getName())
		game.add.existing(this)
		this.name = name
		this.facing = direction
		this.scale.x = direction
		game.anims.create(name, {
			frames: game.textures.generateTextureNames(sheet.getName(), 0, 40),
			frameRate: 30
		})
		this.update()
	}

	public get direction(): CharDirection {
		return this.facing
	}

	public set direction(value: CharDirection) {
		if (this.facing !== value) {
			this.facing = value
			this.scale.x = value
		}
	}

	public get stateName(): string {
		return this.stateName
	}

	public set state(value: string) {
		if (this.stateName === value) {
			return
		}

		if (this.stateName === CharStates.dead) {
			return
		}

		this.state = CHAR_STATES[value]
		this.stateName = value

		const lastTime = performance.now()
		this.play(this.name, true)
		this.update(lastTime)
	}

	public restore(amount: number): void {
		if (this.stateName === CharStates.dead) {
			return
		}
		this.health = Math.min(config.MAX_HEALTH, this.health + amount)
		this.state = this.state.power ? CharStates.power : CharStates.heal
		this.lastAction = performance.now()
	}

	public face(enemy: Char): void {
		this.direction = enemy.x > this.x ? CharDirection.right : CharDirection.left
	}

	protected update(time = performance.now(), force = false): void {
		if (this.stateName === CharStates.dead) {
			if (!force) {
				return
			}
			if (this.anims.currentAnim.frameIndex >= 4) {
				this.anims.stop()
			}
		}

		const duration = this.state.fps ? 1000 / this.state.fps : 100
		const last = this.lastAction + duration * (this.state.pick ? 1 : this.state.frames.length)

		if (time >= last) {
			this.state = this.state.power ? CHAR_STATES.power : CHAR_STATES.idle
			this.stateName = this.state.power ? CharStates.power : CharStates.idle
			this.play(this.name, true)
			this.lastAction = time
		}

		if (this.state.fps && this.state.loop) {
			const frame = this.state.fps ? Math.floor(time / (1000 / this.state.fps)) : 0
			this.anims.currentAnim.frameIndex = this.state.frames[frame % this.state.frames.length]
		}
	}
}
