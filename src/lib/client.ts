import { QueryClient } from '@tanstack/svelte-query'

export const queryClient = new QueryClient()

export const EventlabBaseUrl = import.meta.env.DEV
	? 'http://localhost:8300'
	: 'https://api.eventlab.dev'

export const AukusBaseUrl = import.meta.env.DEV
	? 'http://localhost:8301'
	: 'https://aukus.eventlab.dev'
