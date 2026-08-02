<script lang="ts">
	import PlayerAvatar from '../player/PlayerAvatar.svelte'
	import Socials from '../Socials.svelte'
	import ImageLoader from '../ImageLoader.svelte'
	import { FALLBACK_GAME_POSTER } from '$lib/constants'
	import { formatMs, getPlayerCleanScore, playerMoveToCommonGame } from '$lib/utils'
	import MoveCard from '../moveCard/MoveCard.svelte'
	import { GamesMatchesStore } from '$lib/stores/GamesMatchesStore.svelte'
	import { PlayerMovesStore } from '$lib/stores/PlayersMovesStore.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	type Props = {
		playerSlug: string
	}

	const { playerSlug }: Props = $props()
	const app = getAppManager()
	const { eventDataStore, statsStore } = app

	const playerSlugs = $derived(eventDataStore.players.map((p) => p.slug))

	const playerSlugReactive = $derived(playerSlug)

	let gamesMatchesStoreForPlayer = $state(
		new GamesMatchesStore({
			getPlayersSlugs: () => playerSlugs
		})
	)
	let playersMovesStoreForPlayer = $state(
		new PlayerMovesStore({
			getPlayerSlug: () => playerSlugReactive
		})
	)

	const [playerMoves, movesQuery] = $derived([
		playersMovesStoreForPlayer.playerMoves,
		playersMovesStoreForPlayer.movesQuery
	])

	const gamesMatched = $derived(
		gamesMatchesStoreForPlayer.gamesMatched
	)

	$effect(() => {
		if (!playerSlug) {
			return
		}
		// gamesMatchesStoreForPlayer = createGamesMatchesStore({ eventDataStore, playerSlug })
		// playersMovesStoreForPlayer = createPlayerMovesStore({ playerSlug })

	 	playersMovesStoreForPlayer.queryParams = {
			players: [playerSlug],
			start_ts: null,
			search_title: null,
			igdb_ids: [],
			exclude_ids: undefined
		}
	})

	$effect(() => {
		if (!playerSlug || movesQuery.isLoading || movesQuery.isFetching) {
			gamesMatchesStoreForPlayer.gamesMatchParams = {
				igdb_ids: [],
				exclude_player: undefined
			}
			return
		}

		const movesForCurrentPlayer = playerMoves.filter((move) => move.player_slug === playerSlug)

		if (movesForCurrentPlayer.length > 0) {
			gamesMatchesStoreForPlayer.gamesMatchParams = {
				igdb_ids: movesForCurrentPlayer
					.map((move) => move.game_id)
					.filter((id): id is number => id !== null),
				exclude_player: playerSlug
			}
		} else {
			gamesMatchesStoreForPlayer.gamesMatchParams = {
				igdb_ids: [],
				exclude_player: undefined
			}
		}
	})

	const player = $derived.by(() => {
		if (!playerSlug) return null
		return app.playersBySlug.get(playerSlug) || null
	})

	const gamesCompleted = $derived(
		playerMoves.filter((move) => move.type === 'completed').length || 0
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

	const cleanScore = $derived.by(() => {
		if (!playerSlug) return 0;
		const stats = statsStore.statsBySlug.get(playerSlug);
		if (!stats) return 0;
		return getPlayerCleanScore(stats);
	});
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
				<div class="text-xs text-muted-foreground">Чистые очки: {cleanScore}</div>
			</div>
			<div class="flex flex-col gap-2 rounded-xl bg-card p-3">
				<div class="flex justify-between text-sm font-semibold text-muted-foreground">
					<div>Стримит на {platformName}</div>
					{#if player.current_game_duration}
						<div>{formatMs((player.current_game_duration || 0) * 1000)}</div>
					{/if}
				</div>
				<div class="flex gap-2">
					{#if player.current_game}
						<ImageLoader
							src={player.current_game_cover || FALLBACK_GAME_POSTER}
							alt={player.current_game}
							class="h-[58px] w-[43px] overflow-hidden"
						/>
					{/if}
					<div class="text-xl font-bold">{player.current_game || 'Выбирает игру...'}</div>
				</div>
			</div>
		</div>

		<div class="mt-4 w-full space-y-4">
			{#each playerMoves as move (move.id)}
				{@const matchedGames = gamesMatched.filter((game) => game.game_title === move.item_title)}
				<MoveCard {move} {matchedGames} game={playerMoveToCommonGame(move)}/>
			{/each}
		</div>
	</div>
{/if}

