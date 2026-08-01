<script lang="ts">
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte'
	import Socials from '$lib/components/Socials.svelte'
	import { fade } from 'svelte/transition'
	import Summary from './components/Summary.svelte'
	import MoveCard from '$lib/components/moveCard/MoveCard.svelte'
	import Canvas from './components/Canvas.svelte'
	import StaticCanvas from './components/StaticCanvas.svelte'
	import EditPanel from './components/EditPanel.svelte'
	import { GamesMatchesStore } from '$lib/stores/GamesMatchesStore.svelte'
	import { PlayerMovesStore } from '$lib/stores/PlayersMovesStore.svelte'
	import Footer from '$lib/components/Footer.svelte'
	import Loader from '$lib/components/Loader.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import TierList from '$lib/components/tierlist/TierList.svelte'
	import { playerMoveToCommonGame } from '$lib/utils'

	type Props = {
		playerSlug: string
	}

	let { playerSlug }: Props = $props()

	const app = getAppManager()
	const { canvasStore, eventDataStore } = app

	const playerSlugs = $derived(eventDataStore.players.map((p) => p.slug))

	const playerSlugReactive = $derived(playerSlug)

	let gamesMatchesStoreForPlayer = $state(
		new GamesMatchesStore({
			getPlayerSlug: () => playerSlugReactive,
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

	const commonGames = $derived(playerMoves.map(playerMoveToCommonGame))

	const gamesMatched = $derived(
		gamesMatchesStoreForPlayer.gamesMatched
	)

	$effect(() => {
		if (!playerSlug) {
			return
		}
		// console.log('creating store for', page.params.player)
		// gamesMatchesStoreForPlayer = new GamesMatchesStore({
		// 	getPlayerSlug: () => playerSlugReactive,
		// 	getPlayersSlugs: () => playerSlugs
		// })
		// playersMovesStoreForPlayer = new PlayerMovesStore({
		// 	getPlayerSlug: () => playerSlugReactive
		// })

		playersMovesStoreForPlayer.queryParams = {
			players: [playerSlug],
			start_ts: null,
			search_title: null,
			igdb_ids: [],
			exclude_ids: undefined
		}
		canvasStore.playerSlug = playerSlug
	})

	$effect(() => {
		const currentPlayer = playerSlug

		if (!currentPlayer || movesQuery.isLoading || movesQuery.isFetching) {
		    gamesMatchesStoreForPlayer.gamesMatchParams = {
				igdb_ids: [],
				exclude_ids_moves: [],
				exclude_ids_history: [],
				exclude_player: playerSlug
			}
			return
		}

		const movesForCurrentPlayer = playerMoves.filter((move) => move.player_slug === currentPlayer)

		if (movesForCurrentPlayer.length > 0) {
			gamesMatchesStoreForPlayer.gamesMatchParams = {
				igdb_ids: movesForCurrentPlayer.map((move) => move.game_id).filter(Boolean) as number[],
				exclude_ids_moves: movesForCurrentPlayer
					.map((move) => move.game_id)
					.filter(Boolean) as number[],
				exclude_ids_history: [],
				exclude_player: currentPlayer
			}
		} else {
			gamesMatchesStoreForPlayer.gamesMatchParams = {
				igdb_ids: [],
				exclude_ids_moves: [],
				exclude_ids_history: [],
				exclude_player: playerSlug
			}
		}
	})

	const player = $derived.by(() => {
		if (!playerSlug) return null
		return app.playersBySlug.get(playerSlug) ?? null
	})

	const gamesCompleted = $derived(
		playerMoves.filter((move) => move.type === 'completed').length || 0
	)

	let contentContainer = $state<HTMLDivElement | null>(null)
	let contentHeight = $state(0)

	const canvasCenter = $derived(canvasStore.canvasWidth / 2)

	function handleResize() {
		if (contentContainer) {
			const left = (canvasStore.canvasWidth - window.innerWidth) / 2
			document.getElementById('canvas-container')?.scrollTo({ left, behavior: 'instant' })

			console.log({
				containerWidth: contentContainer.clientWidth,
				windowWidth: window.innerWidth,
				canvasWidth: canvasStore.canvasWidth,
				canvasCenter,
				left
			})

			contentHeight = contentContainer.clientHeight
		}
	}

	$effect(() => {
		if (contentContainer) {
			const observer = new ResizeObserver(() => {
				handleResize()
			})
			observer.observe(contentContainer)
			// Initial measure
			handleResize()
			return () => observer.disconnect()
		}
	})

	const widthStyle = $derived(`width: ${canvasStore.canvasWidth}px`)

	const isLoading = $derived(movesQuery.isLoading || movesQuery.isFetching)
</script>

<svelte:head>
	{#if player}
		<title>Aukus - {player.username}</title>
	{/if}
</svelte:head>

{#if player}
	<EditPanel playerSlug={player.slug} />
	<div
		class="relative min-h-screen overflow-x-auto"
		id="canvas-container"
		bind:this={contentContainer}
	>
		<div class="mx-auto mb-80" style={widthStyle}>
			{#if canvasStore.editMode}
				<Canvas {canvasCenter} {contentHeight} />
			{:else}
				<StaticCanvas {canvasCenter} {contentHeight} />
			{/if}
			<div
				class="relative mx-auto flex w-full flex-col items-center justify-center overflow-auto pt-20"
				in:fade
			>
				<PlayerAvatar
					src={player.avatar_link ?? ''}
					name={player.username}
					isOnline={Boolean(player.is_online)}
					size="lg"
					class="mb-2.5"
				/>

				{#if isLoading}
					<div class="mt-20">
						<Loader class="size-20" />
					</div>
				{:else}
					<div class="mb-[30px] flex flex-col items-center gap-5">
						<div class="text-5xl leading-[58px] font-bold">
							{player.first_name} «{player.username}»
						</div>
						<Socials {player} />
						<Summary
							totalScore={player.total_score}
							{gamesCompleted}
							gameName={player.current_game || ''}
							gameImage={player.current_game_cover || ''}
							gameDuration={player.current_game_duration || 0}
							mainPlatform={player.main_platform}
							playerSlug={player.slug}
						/>
					</div>

					<TierList games={commonGames} />

					<div class="mt-5 space-y-[200px]">
						<div class="space-y-5">
							<!-- <CurrentGameCard playerSlug={player.slug} /> -->
							{#each playerMoves as move (move.id)}
								{@const matchedGames = gamesMatched.filter(
									(game) => game.game_title === move.item_title
								)}
								<MoveCard {move} {matchedGames} />
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<Footer />
