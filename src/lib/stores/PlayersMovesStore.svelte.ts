import { AukusBaseUrl } from '$lib/client'
import { getPlayerMovesApiPlayersMovesGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import type { GetPlayerMovesApiPlayersMovesGetData } from '$lib/heyapi/aukus/types.gen'
import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
import { derived, writable } from 'svelte/store'

type QueryParams = GetPlayerMovesApiPlayersMovesGetData['query']

export function createPlayerMovesStore({ playerSlug }: { playerSlug?: string }) {
	const queryClient = useQueryClient()

	const queryParams = writable<QueryParams>({
		players: playerSlug ? [playerSlug] : [],
		start_ts: null,
		search_title: null
	})

	const movesQuery = createQuery(
		derived(queryParams, ($queryParams) => {
			return {
				...getPlayerMovesApiPlayersMovesGetOptions({
					baseUrl: AukusBaseUrl,
					query: $queryParams
				})
			}
		})
	)

	const playerMoves = derived([movesQuery], ([$movesQuery]) => {
		if ($movesQuery.isLoading || $movesQuery.isFetching) {
			return []
		}
		return $movesQuery.data?.moves ?? []
	})

	const updatePlayerMove = createMutation({
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

			const response = await fetch(`${AukusBaseUrl}/api/players/moves/${moveId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(data)
			})

			if (!response.ok) {
				const error = await response.json().catch(() => ({}))
				throw new Error(error.detail || `Failed to update move: ${response.statusText}`)
			}

			return response.json()
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: getPlayerMovesApiPlayersMovesGetOptions({
					baseUrl: AukusBaseUrl
				}).queryKey
			})
		}
	})

	return {
		queryParams,
		movesQuery,
		playerMoves,
		updatePlayerMove
	}
}
