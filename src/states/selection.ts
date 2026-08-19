import { Spritesheets } from '../assets'

const names = Object.keys(Spritesheets)

export const selection: { [player: number]: number } = { 1: 0, 2: 0 }

export function characterOf(player: number): string {
	return Spritesheets[names[selection[player]]].getName()
}

export function cycle(player: number, dir: 1 | -1): void {
	const n = names.length
	selection[player] = (selection[player] + dir + n) % n
}

export function reset(): void {
	selection[1] = 0
	selection[2] = 0
}