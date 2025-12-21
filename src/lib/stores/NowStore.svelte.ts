import { derived, writable } from 'svelte/store'

export function createNowStore() {
	const nowMs = writable(Date.now())

	let interval: ReturnType<typeof setInterval>

	if (typeof window !== 'undefined') {
		interval = setInterval(() => {
			nowMs.set(Date.now())
		}, 1000)
	}

	const cleanup = () => {
		if (interval) {
			clearInterval(interval)
		}
	}

	const nowSeconds = derived(nowMs, ($nowMs) => Math.floor($nowMs / 1000))

	return {
		nowMs,
		nowSeconds,
		cleanup
	}
}
