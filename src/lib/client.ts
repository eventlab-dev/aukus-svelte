import { QueryClient, MutationCache, QueryCache } from '@tanstack/svelte-query'

type ErrorCallback = (path: string, statusCode: number, message: string) => void

let errorCallback: ErrorCallback | null = null

export function setErrorCallback(callback: ErrorCallback) {
	errorCallback = callback
}

function handleError(error: unknown, url?: string, contextData?: Record<string, unknown>) {
	if (!errorCallback) return

	let path = url || 'Unknown'
	let statusCode = 0
	let message = 'Unknown error'

	if (typeof error === 'object' && error !== null) {
		const errorObj = error as Record<string, unknown>

		if ('request' in errorObj && errorObj.request instanceof Request) {
			const requestUrl = new URL(errorObj.request.url)
			path = requestUrl.pathname + requestUrl.search
		}

		if ('response' in errorObj && errorObj.response instanceof Response) {
			statusCode = errorObj.response.status
		}

		if ('error' in errorObj) {
			const apiError = errorObj.error
			if (typeof apiError === 'string') {
				message = apiError
			} else if (typeof apiError === 'object' && apiError !== null) {
				const errorBody = apiError as Record<string, unknown>
				if ('detail' in errorBody && typeof errorBody.detail === 'string') {
					message = errorBody.detail
				} else if ('message' in errorBody && typeof errorBody.message === 'string') {
					message = errorBody.message
				} else if (typeof errorBody.detail === 'object' && Array.isArray(errorBody.detail)) {
					const details = errorBody.detail as Array<{ msg?: string }>
					if (details.length > 0 && details[0].msg) {
						message = details[0].msg
					}
				}
			}
		}

		if ('message' in errorObj && typeof errorObj.message === 'string' && message === 'Unknown error') {
			message = errorObj.message
		}

		if (error instanceof Error && message === 'Unknown error') {
			message = error.message
		}
	}

	if (path === 'Unknown' && contextData) {
		if ('_id' in contextData && typeof contextData._id === 'string') {
			path = contextData._id
		}
	}

	errorCallback(path, statusCode, message)
}

export const queryClient = new QueryClient({
	mutationCache: new MutationCache({
		onError: (error, variables, _context, mutation) => {
			let contextData: Record<string, unknown> | undefined

			if (typeof variables === 'object' && variables !== null) {
				contextData = variables as Record<string, unknown>
			}

			handleError(error, undefined, contextData)
		}
	}),
	queryCache: new QueryCache({
		onError: (error, query) => {
			let contextData: Record<string, unknown> | undefined

			if (query.queryKey && Array.isArray(query.queryKey) && query.queryKey.length > 0) {
				const queryKeyData = query.queryKey[0]
				if (typeof queryKeyData === 'object' && queryKeyData !== null) {
					contextData = queryKeyData as Record<string, unknown>
				}
			}

			handleError(error, undefined, contextData)
		}
	})
})

export const EventlabBaseUrl = import.meta.env.VITE_EVENTLAB_BASE_URL
export const AukusBaseUrl = import.meta.env.VITE_AUKUS_BASE_URL
