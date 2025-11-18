import { EventlabBaseUrl } from '$lib/client'

export interface EmoteItem {
	id: string
	name: string
	owner_username: string | null
	listed: boolean
	cdn_url: string
}

export interface EmoteSearchRequest {
	search_term?: string
	limit?: number
	page?: number
}

export interface EmoteSearchResponse {
	emotes: EmoteItem[]
}

export async function searchEmotes(
	request: EmoteSearchRequest,
	token?: string
): Promise<EmoteSearchResponse> {
	const headers: HeadersInit = {
		'Content-Type': 'application/json'
	}

	if (token) {
		headers['Authorization'] = `Bearer ${token}`
	}

	const response = await fetch(`${EventlabBaseUrl}/api/emotes/search`, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			search_term: request.search_term || '',
			limit: request.limit || 50,
			page: request.page || 1
		})
	})

	if (!response.ok) {
		throw new Error(`Failed to search emotes: ${response.statusText}`)
	}

	return response.json()
}

