import { AukusBaseUrl } from '$lib/client'
import { getCanvasFilesApiCanvasPlayerSlugGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import { defaultAuth } from '$lib/utils'
import { createQuery } from '@tanstack/svelte-query'
import { derived, writable } from 'svelte/store'

export function createCanvasStore() {
	const editable = writable(false)
	const playerSlug = writable('')

	const canvasQuery = createQuery(
		derived(playerSlug, ($playerSlug) => {
			return getCanvasFilesApiCanvasPlayerSlugGetOptions({
				baseUrl: AukusBaseUrl,
				auth: defaultAuth,
				path: { player_slug: $playerSlug }
			})
		})
	)

	const files = derived(canvasQuery, ($canvasQuery) => $canvasQuery.data?.files || [])

	return { playerSlug, canvasQuery, files, editable }
}
