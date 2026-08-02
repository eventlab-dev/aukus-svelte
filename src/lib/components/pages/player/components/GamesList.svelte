<script lang="ts">
	import Loader from '$lib/components/Loader.svelte'
	import GameCard from '$lib/components/gameCard/GameCard.svelte'
	import TierList from '$lib/components/tierlist/TierList.svelte'
	import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { GameHistoryStore } from '$lib/stores/GamesHistoryStore.svelte'
	import { GamesMatchesStore } from '$lib/stores/GamesMatchesStore.svelte'
	import { playerMoveToCommonGame } from '$lib/utils'

	type Props = {
		playerSlug: string
		event: string
		playerMoves?: PlayerMoveItem[]
	}

	let { playerSlug, event, playerMoves = [] }: Props = $props()

	const app = getAppManager()
	const { eventDataStore } = app

	const historyStore = new GameHistoryStore({
		getPlayersSlugs: () => []
	})

	historyStore.searchParams = {
		events: [event],
		players: [playerSlug]
	}

	const historyGames = $derived(historyStore.gamesHistoryByEvent.get(event) ?? [])
	const currentEventGames = $derived(playerMoves.map(playerMoveToCommonGame))

	const playerSlugs = $derived(eventDataStore.players.map((p) => p.slug))

	const matchStore = new GamesMatchesStore({
		getPlayersSlugs: () => playerSlugs
	})

	const matchIgdbIds = $derived.by(() => {
		if (playerMoves.length > 0) {
			return playerMoves.map((m) => m.game_id).filter((id): id is number => id !== null)
		}
		return historyGames.map((g) => g.igdb_id).filter((id): id is number => id !== null)
	})

	$effect(() => {
		if (playerMoves.length === 0 && historyStore.historyQuery.isPending) {
			matchStore.gamesMatchParams = {
				igdb_ids: [],
				exclude_player: playerSlug
			}
		} else {
			matchStore.gamesMatchParams = {
				igdb_ids: matchIgdbIds,
				exclude_player: playerSlug
			}
		}
	})

	const allMatchedGames = $derived(matchStore.gamesMatched)
</script>

{#if currentEventGames.length > 0}
	<TierList games={currentEventGames} />
	<div class="mt-5 space-y-[200px]">
		<div class="space-y-5">
			<!-- <CurrentGameCard playerSlug={player.slug} /> -->
			{#each playerMoves as move (move.id)}
				{@const matchedGames = allMatchedGames.filter((m) => m.igdb_id === move.game_id)}
				<GameCard {move} game={playerMoveToCommonGame(move)} {matchedGames} />
			{/each}
		</div>
	</div>
{:else if historyStore.historyQuery.isFetching}
	<div class="my-10 flex justify-center">
		<Loader class="inline size-20" />
	</div>
{:else}
	<TierList games={historyGames} />
	<div class="mt-5 space-y-[200px]">
		<div class="space-y-5">
			{#each historyGames as game (game.id)}
				{@const matchedGames =	allMatchedGames.filter((m) => m.igdb_id === game.igdb_id)}
				<GameCard {game} {matchedGames} />
			{/each}
		</div>
	</div>
{/if}
