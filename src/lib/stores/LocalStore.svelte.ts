import { browser } from '$app/environment'
import { writable } from 'svelte/store'

export function createLocalStore<T>(key: string, defaultValue: T) {
	const storageValue = writable<T>(defaultValue)
	const localValue = writable<T>(defaultValue)

	const eventKey = `storage-save-${key}`

	if (browser) {
		function updateLocalValue() {
			const savedValue = localStorage.getItem(key)
			console.log('updating from localStorage', key, savedValue)
			if (savedValue) {
				try {
					localValue.set(JSON.parse(savedValue))
				} catch {
					localValue.set(defaultValue)
				}
			} else {
				localValue.set(defaultValue)
			}
		}

		window.addEventListener(eventKey, () => {
			updateLocalValue()
		})

		storageValue.subscribe((val) => {
			console.log('saving to localStorage', key, val)
			if (val === null) {
				localStorage.removeItem(key)
			} else {
				localStorage.setItem(key, JSON.stringify(val))
			}
			window.dispatchEvent(new CustomEvent(eventKey))
		})
	}

	return {
		subscribe: localValue.subscribe,
		set: storageValue.set,
		update: storageValue.update
	}
}
