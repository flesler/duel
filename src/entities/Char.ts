import Phaser from 'phaser'
import * as config from '../config'
import * as utils from '../utils'

const DEFAULT_FPS = 8
const SCALE = 1.7

export type CharDirection = 1 | -1

export interface AnimDef {
	frames: number[];
	loop?: boolean;
	pick?: boolean;
	power?: boolean;
	fps?: number
}

export const Anim = {
	idle: 'idle',
	back: 'back',
	charge: 'charge',
	attack: 'attack',
	dead: 'dead',
	heal: 'heal',
	block: 'block',
	hit: 'hit',
	win: 'win',
	power: 'power',
} as const

export type AnimName = typeof Anim[keyof typeof Anim]

const ANIMS: Record<AnimName, AnimDef> = {
	idle: { frames: [1] },
	back: { frames: [18] },
	charge: { frames: [19] },
	attack: { frames: [36, 37, 38, 37], loop: true },
	dead: { frames: [58, 63, 64, 64, 64, 61], fps: 3 },
	heal: { frames: [16, 17], power: true, fps: 3 },
	block: { frames: [54, 55], pick: true },
	hit: { frames: [57, 58, 59], pick: true },
	win: { frames: [1, 4, 5, 40, 41, 41, 40, 1], power: true, fps: 5 },
	power: { frames: [108, 109, 110, 111], loop: true, fps: 12 },
}

/** @deprecated use Anim */
export const CharStates = Anim

export class Char extends Phaser.Physics.Arcade.Sprite {
	public health = 100
	public maxHealth = 100
	public tile = 0
	public facing: CharDirection

	private textureKey: string
	private stateName: AnimName = Anim.idle

	constructor(scene: Phaser.Scene, textureKey: string, direction: CharDirection) {
		super(scene, 0, 0, textureKey)
		scene.add.existing(this)
		this.textureKey = textureKey
		this.facing = direction
		this.setOrigin(0.5, 1)
		this.setScale(direction * SCALE, SCALE)

		for (const name of Object.keys(ANIMS) as AnimName[]) {
			const def = ANIMS[name]
			const key = `${textureKey}-${name}`
			if (!scene.anims.exists(key)) {
				scene.anims.create({
					key,
					frames: scene.anims.generateFrameNumbers(textureKey, { frames: def.frames }),
					frameRate: def.fps || DEFAULT_FPS,
					repeat: def.loop ? -1 : 0,
				})
			}
		}

		this.setCharState(Anim.idle)
	}

	public get direction(): CharDirection {
		return this.facing
	}

	public set direction(value: CharDirection) {
		if (this.facing !== value) {
			this.facing = value
			this.setScale(value * SCALE, SCALE)
		}
	}

	public get isDead(): boolean {
		return this.health <= 0
	}

	public setHp(hp: number, maxHp: number): void {
		this.maxHealth = maxHp
		this.health = Math.min(maxHp, Math.max(0, hp))
	}

	public face(targetX: number): void {
		this.direction = targetX >= this.x ? 1 : -1
	}

	public setCharState(value: AnimName, force = false): void {
		if (!force && (this.stateName === value || this.stateName === Anim.dead)) {
			return
		}
		const def = ANIMS[value]
		if (!def) {
			return
		}
		this.stateName = value
		if (def.pick) {
			this.setFrame(utils.pick(def.frames))
		} else {
			this.play(`${this.textureKey}-${value}`, true)
		}
	}

	public animStateFor(action: string): AnimName {
		switch (action) {
			case 'Strike':
				return Anim.attack
			case 'Push':
				return Anim.charge
			case 'Block':
				return Anim.block
			case 'Heal':
				return Anim.heal
			default:
				return Anim.idle
		}
	}

	public setTile(tile: number): void {
		this.tile = tile
		this.x = (tile + 0.5) * config.TILE_WIDTH
	}
}
