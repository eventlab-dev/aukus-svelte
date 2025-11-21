<script lang="ts">
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte'
	import Socials from '../../../lib/components/Socials.svelte'
	import { fade } from 'svelte/transition'
	import Summary from './components/Summary.svelte'
	import MoveCard from '../../../lib/components/moveCard/MoveCard.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { page } from '$app/state'
	import Canvas from './components/Canvas.svelte'
	import StaticCanvas from './components/StaticCanvas.svelte'
	import EditPanel from './components/EditPanel.svelte'

	const { playersMovesStore, playersBySlug, canvasStore, gamesMatchesStore } =
		getAppManagerContext()
	const { playerMoves, queryParams: movesQueryParams, movesQuery } = playersMovesStore
	const { playerSlug: canvasPlayerSlug, editMode, canvasWidth } = canvasStore
	const { gamesMatchParams, gamesMatched } = gamesMatchesStore

	$effect(() => {
		if (!page.params.player) {
			return
		}
		movesQueryParams.set({ 
			players: [page.params.player], 
			start_ts: null,
			search_title: null,
			titles: undefined,
			exclude_ids: undefined
		})
		canvasPlayerSlug.set(page.params.player)
	})

	$effect(() => {
		const currentPlayer = page.params.player
		
		if (!currentPlayer || $movesQuery.isLoading || $movesQuery.isFetching) {
			gamesMatchParams.set({
				titles: [],
				exclude_ids_moves: [],
				exclude_ids_history: []
			})
			return
		}
		
		const movesForCurrentPlayer = $playerMoves.filter((move) => 
			move.player_slug === currentPlayer
		)
		
		if (movesForCurrentPlayer.length > 0) {
			gamesMatchParams.set({
				titles: movesForCurrentPlayer.map((move) => move.item_title),
				exclude_ids_moves: movesForCurrentPlayer.map((move) => move.game_id).filter(Boolean) as number[],
				exclude_ids_history: []
			})
		} else {
			gamesMatchParams.set({
				titles: [],
				exclude_ids_moves: [],
				exclude_ids_history: []
			})
		}
	})

	const player = $derived.by(() => {
		if (!page.params.player) return null
		return $playersBySlug[page.params.player] || null
	})
	const gamesCompleted = $derived(
		$playerMoves.filter((move) => move.type === 'completed').length || 0
	)

	let contentContainer = $state<HTMLDivElement | null>(null)
	let contentWidth = $state(0)
	let contentCenter = $state(0)
	let contentHeight = $state(0)

	function handleResize() {
		if (contentContainer) {
			const contentSize = Math.max($canvasWidth, contentContainer.clientWidth)
			contentCenter = contentSize / 2

			const left = (contentSize - window.innerWidth) / 2
			document.getElementById('canvas-container')?.scrollTo({ left, behavior: 'instant' })

			contentHeight = contentContainer.clientHeight
			contentWidth = contentContainer.clientWidth
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

	// $inspect('StaticCanvas', $displayImages)
	// $inspect('StaticCanvas width', canvasWidth)
	// $inspect('content center', contentCenter)

	const widthStyle = $derived($canvasWidth > contentWidth ? `width: ${$canvasWidth}px;` : '')
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
		<div class="mx-auto" style={widthStyle}>
			{#if $editMode}
				<Canvas {contentCenter} {contentHeight} />
			{:else}
				<StaticCanvas {contentCenter} />
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
					/>
				</div>

				<div class="mt-5 space-y-[200px]">
					<div class="space-y-5">
						<!-- <CurrentGameCard playerSlug={player.slug} /> -->
						{#each $playerMoves as move (move.id)}
							{@const matchedGames = $gamesMatched.filter(
								(game) => game.game_title === move.item_title
							)}
							<MoveCard {move} {matchedGames} />
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
