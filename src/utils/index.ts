export function pick<T>(arr: T[]): T | undefined {
	if (!arr.length) {
		return
	}
	return arr[Math.floor(Math.random() * arr.length)] as T
}

export function values(obj: any): any[] {
	return Object.keys(obj).map(key => obj[key])
}

export function rand(min: number, max: number): number {
	return Math.random() * (max - min) + min
}

export function randint(min: number, max: number): number {
	return Math.round(rand(min, max))
}
