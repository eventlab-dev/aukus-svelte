import { writable } from 'svelte/store'

export type ErrorNotification = {
	id: string
	path: string
	statusCode: number
	message: string
}

export function createErrorNotificationStore() {
	const notifications = writable<ErrorNotification[]>([])

	function addError(path: string, statusCode: number, message: string) {
		const id = `${Date.now()}-${Math.random()}`
		notifications.update((current) => [...current, { id, path, statusCode, message }])
	}

	function removeError(id: string) {
		notifications.update((current) => current.filter((n) => n.id !== id))
	}

	function clear() {
		notifications.set([])
	}

	return {
		notifications,
		addError,
		removeError,
		clear
	}
}

export type ErrorNotificationStore = ReturnType<typeof createErrorNotificationStore>

