export const clamp = (value: number, min = 0, max = 1): number =>
	value < min ? min : value > max ? max : value

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export const randRange = (min: number, max: number): number => min + Math.random() * (max - min)

export const chance = (probability: number): boolean => Math.random() < probability

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

export const easeInOutQuad = (t: number): number =>
	t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

export function pickWeighted<T>(items: readonly T[], weight: (item: T) => number): T {
	let total = 0
	for (const item of items) total += Math.max(0, weight(item))
	let roll = Math.random() * total
	for (const item of items) {
		roll -= Math.max(0, weight(item))
		if (roll <= 0) return item
	}
	return items[items.length - 1]
}

/** `07:05` for an in-game minute count. */
export function formatClock(minutes: number): string {
	const m = Math.round(((minutes % 1440) + 1440) % 1440)
	const hh = Math.floor(m / 60)
		.toString()
		.padStart(2, '0')
	const mm = (m % 60).toString().padStart(2, '0')
	return `${hh}:${mm}`
}
