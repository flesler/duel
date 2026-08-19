import Phaser from 'phaser'
import { Spritesheets } from '../assets'
import * as config from '../config'

export enum CharDirection {
	left = -1, right = 1
}

export const CharStates = {
	idle: 'idle', back: 'back', charge: 'charge', attack: 'attack', block: 'block', heal: 'heal', hit: 'hit', win: 'win', dead: 'dead'
}

export interface State {
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
	dead: { frames: [35, 36, 37, 38, 39, 40], fps: 3 },
	power: { frames: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], fps: 20, power: true }
}

export class Char extends Phaser.Physics.Arcade.Sprite {
	public health = config.MAX_HEALTH
	public tile = 0
	public cooldownEnd = 0
	public facing: CharDirection

	protected name: string
	protected lastAction = 0
	protected stateDef: State = null
	protected stateDefName: string = null

	constructor(scene: Phaser.Scene, name: string, direction: CharDirection) {
		const sheet = Spritesheets[name]
		super(scene, 100, 100, sheet.getName())
		scene.add.existing(this)
		this.name = name
		this.facing = direction
		this.scale.x = direction

		for (const stateName of Object.keys(CHAR_STATES)) {
			const def = CHAR_STATES[stateName]
			scene.anims.create(`${name}-${stateName}`, {
				texture: sheet.getName(),
				frames: def.frames,
				frameRate: def.fps || 10,
				repeat: def.loop ? -1 : 0
			})
		}
		this.setCharState(CharStates.idle)
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
		return this.stateDefName
	}

	public setCharState(value: string): void {
		if (this.stateDefName === value || this.stateDefName === CharStates.dead) {
			return
		}
		this.stateDef = CHAR_STATES[value]
		this.stateDefName = value
		this.lastAction = performance.now()
		this.play(`${this.name}-${value}`, false, 0)
	}

	public restore(amount: number): void {
		if (this.stateDefName === CharStates.dead) {
			return
		}
		this.health = Math.min(config.MAX_HEALTH, this.health + amount)
		this.setCharState(this.stateDef.power ? CharStates.power : CharStates.heal)
	}

	public face(enemy: Char): void {
		this.direction = enemy.x > this.x ? CharDirection.right : CharDirection.left
	}

	protected update(time = performance.now(), force = false): void {
		if (this.stateDefName === CharStates.dead) {
			if (!force) {
				return
			}
			this.anims.stop()
			return
		}

		const duration = (this.stateDef.fps ? 1000 / this.stateDef.fps : 100) * (this.stateDef.pick ? 1 : this.stateDef.frames.length)
		if (time >= this.lastAction + duration) {
			this.setCharState(this.stateDef.power ? CharStates.power : CharStates.idle)
		}
	}
}