import { client as aukusClient } from './heyapi/aukus/client.gen'
import { client as eventlabClient } from './heyapi/eventlab/client.gen'

type EnhancedError = {
	request: Request
	response: Response
	error: unknown
}

function setupErrorInterceptor(client: typeof aukusClient) {
	client.interceptors.error.use(async (error, response, request) => {
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

