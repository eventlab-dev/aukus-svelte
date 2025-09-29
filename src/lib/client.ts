import { QueryClient } from '@tanstack/svelte-query'

export const queryClient = new QueryClient()

export const EventlabBaseUrl = import.meta.env.VITE_EVENTLAB_BASE_URL
export const AukusBaseUrl = import.meta.env.VITE_AUKUS_BASE_URL
