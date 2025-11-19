import { client as aukusClient } from './heyapi/aukus/client.gen'
import { client as eventlabClient } from './heyapi/eventlab/client.gen'

type EnhancedError = {
	request: Request
	response: Response
	error: unknown
}

type TokenInvalidatedCallback = () => void

let tokenInvalidatedCallback: TokenInvalidatedCallback | null = null

export function setTokenInvalidatedCallback(callback: TokenInvalidatedCallback) {
	tokenInvalidatedCallback = callback
}

function setupErrorInterceptor(client: typeof aukusClient) {
	client.interceptors.error.use(async (error, response, request) => {
		const url = new URL(request.url)
		const isCurrentUserEndpoint = url.pathname.includes('/api/users/current')
		const isUnauthorized = response.status === 401 || response.status === 403

		if (isCurrentUserEndpoint && isUnauthorized) {
			if (typeof localStorage !== 'undefined') {
				localStorage.removeItem('auth_token')
			}
			if (tokenInvalidatedCallback) {
				tokenInvalidatedCallback()
			}
		}

		const enhancedError: EnhancedError = {
			request,
			response,
			error
		}
		return enhancedError as unknown as string
	})
}

export function initializeClientInterceptors() {
	setupErrorInterceptor(aukusClient)
	setupErrorInterceptor(eventlabClient)
}

