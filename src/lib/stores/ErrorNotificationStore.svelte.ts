export type ErrorNotification = {
	id: string
	path: string
	statusCode: number
	message: string
}

export class ErrorNotificationStore {
	notifications = $state<ErrorNotification[]>([])

	addError(path: string, statusCode: number, message: string) {
		const id = `${Date.now()}-${Math.random()}`
		this.notifications = [...this.notifications, { id, path, statusCode, message }]
	}

	removeError(id: string) {
		this.notifications = this.notifications.filter((n) => n.id !== id)
	}

	clear() {
		this.notifications = []
	}
}
