<script lang="ts">
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte'
	import Socials from '$lib/components/Socials.svelte'
	import { fade } from 'svelte/transition'
	import Summary from './components/Summary.svelte'
	import Canvas from './components/Canvas.svelte'
	import StaticCanvas from './components/StaticCanvas.svelte'
	import EditPanel from './components/EditPanel.svelte'
	import { PlayerMovesStore } from '$lib/stores/PlayersMovesStore.svelte'
	import Footer from '$lib/components/Footer.svelte'
	import Loader from '$lib/components/Loader.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
	import GamesList from './components/GamesList.svelte'
	import { Button } from '$lib/components/ui/button'
	import { EventTitles } from '$lib/constants'

	type Props = {
		playerSlug: string
	}

	let { playerSlug }: Props = $props()

	const app = getAppManager()
	const { canvasStore, navStore, gamesHistoryStore } = app

	const movesStore = new PlayerMovesStore({
		getPlayerSlug: () => playerSlug
	})

	const playerMoves = $derived(movesStore.playerMoves)

	let activeTab = $state('aukus5')

	$effect(() => {
		if (!playerSlug) {
			return
		}
		canvasStore.playerSlug = playerSlug
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

	const eventList = $derived.by(() => {
		return (gamesHistoryStore.eventsByPlayer.get(playerSlug) ?? []).toSorted().toReversed()
	})

	const widthStyle = $derived(`width: ${canvasStore.canvasWidth}px`)

	const isLoading = $derived(movesStore.movesQuery.isFetching)
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

					<Tabs bind:value={activeTab} class="w-[800px]">
						<TabsList class="mb-3 flex w-full justify-between gap-2 bg-transparent">
							<div class="flex h-full gap-2">
								<TabsTrigger value="aukus5">Аукус 5</TabsTrigger>
								{#each eventList as event (event)}
									<TabsTrigger class="uppercase" value={event}>{EventTitles[event]}</TabsTrigger>
								{/each}
							</div>
							<Button
								onclick={() =>
									navStore.navigate('/history', { pageParams: { playerSlug }, updateHistory: true })}
								>Поиск игр</Button
							>
						</TabsList>
						<TabsContent value="aukus5">
							<GamesList {playerSlug} event="aukus5" {playerMoves} />
						</TabsContent>
						{#each eventList as event (event)}
							{#if activeTab === event}
								<TabsContent value={event}>
									<GamesList {playerSlug} event={event} />
								</TabsContent>
							{/if}
						{/each}
					</Tabs>
				{/if}
			</div>
		</div>
	</div>
{/if}

<Footer />
