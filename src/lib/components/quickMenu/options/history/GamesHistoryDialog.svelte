<script lang="ts">
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte'
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog'
	import { Input } from '$lib/components/ui/input'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import LoaderCircle from '@lucide/svelte/icons/loader-circle'
	import GameCard from './GameCard.svelte'
	import { ScrollArea } from '$lib/components/ui/scroll-area'
	import { Toggle } from '$lib/components/ui/toggle'
	import X from '@lucide/svelte/icons/x'
	import { type EventName } from '$lib/heyapi/eventlab/types.gen'
	import { EventTitles } from '$lib/constants'
	import { Button } from '$lib/components/ui/button'
	import type { CommonGameItem } from '$lib/types'
	import { playerMoveToCommonGame, uniqBy } from '$lib/utils'
	import Loader from '$lib/components/Loader.svelte'

	const { gamesHistoryStore, players, playersBySlug, playersMovesStore, gamesMatchesStore } =
		getAppManagerContext()
	const { gamesHistoryByEvent, searchParams, historyQuery, hasMore, loadMore } = gamesHistoryStore
	const { gamesMatchParams, gamesMatched } = gamesMatchesStore

	let dialogOpen = $state(false)

	const aukus3Games = $derived($gamesHistoryByEvent['aukus3'] ?? [])
	const aukus2Games = $derived($gamesHistoryByEvent['aukus2'] ?? [])
	const aukus1Games = $derived($gamesHistoryByEvent['aukus1'] ?? [])

	const { queryParams: aukus4QueryParams, playerMoves } = playersMovesStore

	const aukus4Games = $derived($playerMoves.map(playerMoveToCommonGame))

	$effect(() => {
		if (dialogOpen) {
			searchParams.set({
				events: [],
				players: [],
				title_search: null
			})
			aukus4QueryParams.set({
				players: [],
				search_title: null
			})
		}
	})

	let timer: number = 0
	const debounceSearch = (v: string) => {
		clearTimeout(timer)
		if (v.length >= 3 || v.length === 0) {
			timer = setTimeout(() => {
				searchParams.update((p) => ({ ...p, title_search: v }))
				aukus4QueryParams.update((p) => ({ ...p, search_title: v }))
			}, 500)
		}
	}

	const selectedPlayer = $derived($searchParams?.players?.[0] ?? null)

	function selectPlayer(_: boolean, slug: string) {
		if (selectedPlayer === slug) {
			searchParams.update((p) => ({ ...p, players: [] }))
			aukus4QueryParams.update((p) => ({ ...p, players: [] }))
		} else {
			searchParams.update((p) => ({ ...p, players: [slug] }))
			aukus4QueryParams.update((p) => ({ ...p, players: [slug] }))
		}
	}

	const selectedEvent = $derived.by(() => {
		if ($searchParams?.events?.length === 1) {
			return $searchParams.events[0]
		}
		return null
	})

	const eventsList: EventName[] = ['aukus1', 'aukus2', 'aukus3', 'aukus4']

	function selectEvent(_: boolean, event: EventName) {
		if (selectedEvent === event) {
			searchParams.update((p) => ({ ...p, events: ['aukus1', 'aukus2', 'aukus3'] }))
		} else {
			searchParams.update((p) => ({ ...p, events: [event] }))
		}
	}

	const aukus4GamesDisplay = $derived.by<CommonGameItem[]>(() => {
		if (selectedEvent !== 'aukus4' && selectedEvent !== null) {
			return []
		}
		return aukus4Games
	})

	$effect(() => {
		if (!dialogOpen) {
			return
		}

		const gamesTitles = new Set(
			[...aukus4Games, ...aukus3Games, ...aukus2Games, ...aukus1Games]
				.map((game) => game.game_title)
				.slice(0, 50)
		)
		const gamesIdsHistory = [...aukus3Games, ...aukus2Games, ...aukus1Games]
			.map((game) => game.id)
			.slice(0, 50)
		const gamesIdsMoves = aukus4Games.map((game) => game.id).slice(0, 50)
		gamesMatchParams.set({
			titles: [...gamesTitles],
			exclude_ids_moves: gamesIdsMoves,
			exclude_ids_history: gamesIdsHistory
		})
	})

	const isLoading = $derived($historyQuery.isFetching)

	// $inspect(isLoading, 'GamesHistoryDialog isLoading')
	// $inspect($historyQuery.isFetching, ' historyQuery isFetching')
	// $inspect($movesQuery.isFetching, ' movesQuery isFetching')

	const noGames = $derived.by(() => {
		return (
			aukus1Games.length === 0 &&
			aukus2Games.length === 0 &&
			aukus3Games.length === 0 &&
			aukus4GamesDisplay.length === 0
		)
	})

	const gameMatchedMergedWithOthers = $derived.by(() => {
		return uniqBy(
			[...aukus4Games, ...aukus3Games, ...aukus2Games, ...aukus1Games, ...$gamesMatched],
			(g) => `${g.event_name}-${g.id}`
		)
	})

	function openLink(event: 'aukus1' | 'aukus2' | 'aukus3') {
		let url = ''
		if (event === 'aukus1') {
			url =
				'https://docs.google.com/spreadsheets/d/1iGjS41dpxbgjtMTGODZ-j3OG9eMDaZh5kBRiWH-FPk0/edit?gid=1235582040#gid=1235582040'
		} else if (event === 'aukus2') {
			url =
				'https://docs.google.com/spreadsheets/d/16JxvqzWmZgigHVBhsxHQsP4ElpXZ2sl3XbslmkW-m88/edit?gid=1235582040#gid=1235582040'
		} else if (event === 'aukus3') {
			url = 'https://aukus3.eventlab.dev'
		}
		window.open(url, '_blank noopener noreferrer')
	}
</script>

<Dialog bind:open={dialogOpen}>
	<DialogTrigger>
		<SearchIcon /> История игр
	</DialogTrigger>
	<DialogContent
		class="flex h-[80vh] w-[750px] flex-col overflow-hidden bg-[#222222] text-primary-foreground selection:bg-foreground selection:text-background"
	>
		<DialogHeader class="gap-3">
			<DialogTitle class="text-2xl font-bold">История игр</DialogTitle>
		</DialogHeader>
		<div class="mt-10 flex flex-col gap-5">
			<div class="flex w-full flex-wrap gap-2">
				{#each $players as player (player.slug)}
					<Toggle
						variant="default"
						bind:pressed={() => player.slug === selectedPlayer, (v) => selectPlayer(v, player.slug)}
						class="cursor-pointer data-[state=off]:bg-secondary data-[state=on]:bg-[var(--dynamic-color)]"
						style={`--dynamic-color: ${player.color}`}
					>
						{player.username}
						{#if selectedPlayer === player.slug}
							<span class="rounded bg-white/20 p-0.5">
								<X class="stroke-4" />
							</span>
						{/if}
					</Toggle>
				{/each}
			</div>
			<div class="flex w-full flex-wrap gap-2">
				{#each eventsList as eventName (eventName)}
					<Toggle
						variant="default"
						bind:pressed={() => eventName === selectedEvent, (v) => selectEvent(v, eventName)}
						class="cursor-pointer data-[state=off]:bg-secondary data-[state=on]:bg-primary"
					>
						{EventTitles[eventName]}
						{#if selectedEvent === eventName}
							<span class="rounded bg-white/20 p-0.5">
								<X class="stroke-4" />
							</span>
						{/if}
					</Toggle>
				{/each}
			</div>
			<Input
				type="text"
				placeholder="Поиск по названию (3+ символов)"
				class="mb-4 w-full rounded-lg bg-muted"
				value={$searchParams?.title_search ?? ''}
				oninput={(e) => debounceSearch((e.target as HTMLInputElement).value)}
			/>
		</div>
		<ScrollArea class="h-full w-full flex-1" type="always">
			<div class="mt-10 mb-80">
				{#if isLoading}
					<div class="mt-40 flex justify-center">
						<Loader class="inline size-20" />
					</div>
				{:else}
					<div class="flex flex-col gap-5">
						{#if noGames}
							<div class="text-center text-sm text-muted-foreground">Игр не найдено</div>
						{/if}

						{#if aukus4GamesDisplay.length !== 0}
							<div class="p-0 text-center text-3xl">Аукус 4</div>
							{#each aukus4GamesDisplay as game (game.id)}
								{#if $playersBySlug[game.player_name] !== undefined}
									{@const matches = gameMatchedMergedWithOthers.filter(
										(g) => g.game_title === game.game_title && g.player_name !== game.player_name
									)}
									<GameCard {game} matchedGames={matches} />
								{/if}
							{/each}
						{/if}

						{#if aukus3Games.length !== 0}
							<div class="flex justify-center">
								<Button variant="link" class="p-0 text-3xl" onclick={() => openLink('aukus3')}>
									Аукус 3
								</Button>
							</div>
							{#each aukus3Games as game (game.id)}
								{#if $playersBySlug[game.player_name] !== undefined}
									{@const matches = gameMatchedMergedWithOthers.filter(
										(g) => g.game_title === game.game_title && g.player_name !== game.player_name
									)}
									<GameCard {game} matchedGames={matches} />
								{/if}
							{/each}
						{/if}

						{#if aukus2Games.length !== 0}
							<div class="flex justify-center">
								<Button variant="link" class="p-0 text-3xl" onclick={() => openLink('aukus2')}>
									Аукус 2
								</Button>
							</div>
							{#each aukus2Games as game (game.id)}
								{#if $playersBySlug[game.player_name] !== undefined}
									{@const matches = gameMatchedMergedWithOthers.filter(
										(g) => g.game_title === game.game_title && g.player_name !== game.player_name
									)}
									<GameCard {game} matchedGames={matches} />
								{/if}
							{/each}
						{/if}

						{#if aukus1Games.length !== 0}
							<div class="flex justify-center">
								<Button variant="link" class="p-0 text-3xl" onclick={() => openLink('aukus1')}>
									Аукус 1
								</Button>
							</div>
							{#each aukus1Games as game (game.id)}
								{#if $playersBySlug[game.player_name] !== undefined}
									{@const matches = gameMatchedMergedWithOthers.filter(
										(g) => g.game_title === game.game_title && g.player_name !== game.player_name
									)}
									<GameCard {game} matchedGames={matches} />
								{/if}
							{/each}
						{/if}

						{#if $hasMore}
							<div class="flex justify-center">
								<Button onclick={loadMore}>Загрузить ещё</Button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</ScrollArea>
	</DialogContent>
</Dialog>
