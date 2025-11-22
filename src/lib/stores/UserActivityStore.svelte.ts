const INACTIVITY_TIMEOUT = 2 * 60 * 1000 // 2 mins

export function createUserActivityStore() {
	let isInactive = $state(false)
	let timeoutId: ReturnType<typeof setTimeout> | null = null

	const resetTimer = () => {
		if (timeoutId) {
			clearTimeout(timeoutId)
		}

		isInactive = false

		timeoutId = setTimeout(() => {
			isInactive = true
		}, INACTIVITY_TIMEOUT)
	}

	const events = [
		'mousedown',
		'mousemove',
		'keypress',
		'scroll',
		'touchstart',
		'click',
		'keydown',
		'wheel'
	]

	if (typeof window !== 'undefined') {
		events.forEach((event) => {
			document.addEventListener(event, resetTimer, true)
		})

		resetTimer()
	}

	const cleanup = () => {
		if (timeoutId) {
			clearTimeout(timeoutId)
		}

		if (typeof window !== 'undefined') {
			events.forEach((event) => {
				document.removeEventListener(event, resetTimer, true)
			})
		}
	}

	return {
		get isInactive() {
			return isInactive
		},
		resetTimer,
		cleanup
	}
}

export type UserActivityStore = ReturnType<typeof createUserActivityStore>
