<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import PlayerAvatar from '../player/PlayerAvatar.svelte'
	import Socials from '../Socials.svelte'
	import ImageLoader from '../ImageLoader.svelte'
	import { FALLBACK_GAME_POSTER } from '$lib/constants'
	import { formatMs } from '$lib/utils'
	import MoveCard from '../moveCard/MoveCard.svelte'
	import { createGamesMatchesStore } from '$lib/stores/GamesMatchesStore.svelte'
	import { createPlayerMovesStore } from '$lib/stores/PlayersMovesStore.svelte'

	type Props = {
		playerSlug: string
	}

	const { playerSlug }: Props = $props()
	const { playersBySlug, eventDataStore } = getAppManagerContext()

	let gamesMatchesStoreForPlayer = $state(
		createGamesMatchesStore({ eventDataStore, playerSlug })
	)
	let playersMovesStoreForPlayer = $state(createPlayerMovesStore({ playerSlug }))

	const [playerMoves, movesQueryParams, movesQuery] = $derived([
		playersMovesStoreForPlayer.playerMoves,
		playersMovesStoreForPlayer.queryParams,
		playersMovesStoreForPlayer.movesQuery
	])

	const [gamesMatchParams, gamesMatched] = $derived([
		gamesMatchesStoreForPlayer.gamesMatchParams,
		gamesMatchesStoreForPlayer.gamesMatched
	])

	$effect(() => {
		if (!playerSlug) {
			return
		}
		gamesMatchesStoreForPlayer = createGamesMatchesStore({ eventDataStore, playerSlug })
		playersMovesStoreForPlayer = createPlayerMovesStore({ playerSlug })

		movesQueryParams.set({
			players: [playerSlug],
			start_ts: null,
			search_title: null,
			titles: undefined,
			exclude_ids: undefined
		})
	})

	$effect(() => {
		if (!playerSlug || $movesQuery.isLoading || $movesQuery.isFetching) {
			gamesMatchParams.set({
				titles: [],
				exclude_ids_moves: [],
				exclude_ids_history: [],
				exclude_player: undefined
			})
			return
		}

		const movesForCurrentPlayer = $playerMoves.filter((move) => move.player_slug === playerSlug)

		if (movesForCurrentPlayer.length > 0) {
			gamesMatchParams.set({
				titles: movesForCurrentPlayer.map((move) => move.item_title),
				exclude_ids_moves: movesForCurrentPlayer
					.map((move) => move.game_id)
					.filter(Boolean) as number[],
				exclude_ids_history: [],
				exclude_player: playerSlug
			})
		} else {
			gamesMatchParams.set({
				titles: [],
				exclude_ids_moves: [],
				exclude_ids_history: [],
				exclude_player: undefined
			})
		}
	})

	const player = $derived.by(() => {
		if (!playerSlug) return null
		return $playersBySlug[playerSlug] || null
	})

	const gamesCompleted = $derived(
		$playerMoves.filter((move) => move.type === 'completed').length || 0
	)

	function getPlatformName(platform: string | null): string {
		switch (platform?.toLowerCase()) {
			case 'twitch':
				return 'Твич'
			case 'vk':
				return 'VK Play'
			case 'kick':
				return 'Кик'
			default:
				return 'Твич'
		}
	}

	const platformName = $derived(getPlatformName(player?.main_platform ?? null))
</script>

{#if player}
	<div class="flex flex-col items-center gap-4 pb-10">
		<PlayerAvatar
			src={player.avatar_link ?? ''}
			name={player.username}
			isOnline={Boolean(player.is_online)}
			size="lg"
			class="mb-2"
		/>
		<div class="flex flex-col items-center gap-3">
			<div class="text-center text-3xl font-bold">
				{player.first_name} «{player.username}»
			</div>
			<Socials {player} />
		</div>

		<div class="flex w-full flex-col gap-2">
			<div class="flex flex-col gap-2 rounded-xl bg-card p-3">
				<div class="text-sm font-semibold text-muted-foreground">Игр пройдено</div>
				<div class="text-3xl font-bold">{gamesCompleted}</div>
			</div>
			<div class="flex flex-col gap-2 rounded-xl bg-card p-3">
				<div class="text-sm font-semibold text-muted-foreground">Очков получено</div>
				<div class="text-3xl font-bold">{player.total_score}</div>
			</div>
			{#if player.current_game}
				<div class="flex flex-col gap-2 rounded-xl bg-card p-3">
					<div class="flex justify-between text-sm font-semibold text-muted-foreground">
						<div>Стримит на {platformName}</div>
						{#if player.current_game_duration}
							<div>{formatMs((player.current_game_duration || 0) * 1000)}</div>
						{/if}
					</div>
					<div class="flex gap-2">
						<ImageLoader
							src={player.current_game_cover || FALLBACK_GAME_POSTER}
							alt={player.current_game}
							class="h-[58px] w-[43px] overflow-hidden"
						/>
						<div class="text-xl font-bold">{player.current_game}</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="mt-4 w-full space-y-4">
			{#each $playerMoves as move (move.id)}
				{@const matchedGames = $gamesMatched.filter((game) => game.game_title === move.item_title)}
				<MoveCard {move} {matchedGames} />
			{/each}
		</div>
	</div>
{/if}

