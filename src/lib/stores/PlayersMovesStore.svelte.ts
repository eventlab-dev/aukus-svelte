import { AukusBaseUrl } from '$lib/client'
import { getPlayerMovesApiPlayersMovesGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import type { GetPlayerMovesApiPlayersMovesGetData } from '$lib/heyapi/aukus/types.gen'
import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'

type QueryParams = NonNullable<GetPlayerMovesApiPlayersMovesGetData['query']>

type Params = {
	getPlayerSlug: () => string | undefined
}

export class PlayerMovesStore {
	queryClient = useQueryClient()

	getPlayerSlug: Params['getPlayerSlug'] = () => undefined
	
	constructor(params: Params) {
		this.getPlayerSlug = params.getPlayerSlug
	}

	queryParams = $derived.by<QueryParams>(() => {
		const slug = this.getPlayerSlug()
		return {
			players: slug ? [slug] : [],
			start_ts: null,
			search_title: null
		}
	})

	movesQuery = createQuery(() => getPlayerMovesApiPlayersMovesGetOptions({
		baseUrl: AukusBaseUrl,
		query: this.queryParams
	}))

	playerMoves = $derived(this.movesQuery.data?.moves ?? [])

	updatePlayerMove = createMutation(() => ({
		mutationFn: async ({
			moveId,
			data
		}: {
			moveId: number
			data: { item_review?: string; item_rating?: number; vod_links?: string | null }
		}) => {
			const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
			if (!token) {
				throw new Error('Not authenticated')
			}

			// TODO FIX TO USE GEN API CODE
			const response = await fetch(`${AukusBaseUrl}/api/players/moves/${moveId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(data)
			})

			if (!response.ok) {
				throw new Error('Failed to update player move')
			}

			return response.json()
		},
		onSuccess: () => {
			this.queryClient.invalidateQueries({
				queryKey: getPlayerMovesApiPlayersMovesGetOptions({
					baseUrl: AukusBaseUrl
				}).queryKey
			})
		}
	}))
}
