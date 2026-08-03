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
	import { ScrollArea } from '$lib/components/ui/scroll-area'
	import { EventTitles } from '$lib/constants'
	import { Button } from '$lib/components/ui/button'
	import { playerMoveToCommonGame, uniqBy } from '$lib/utils'
	import Loader from '$lib/components/Loader.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import GameCard from '$lib/components/gameCard/GameCard.svelte'
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte'

	const app = getAppManager()

	const { gamesHistoryStore, playersMovesStore, gamesMatchesStore } = app

	let dialogOpen = $state(true)

	const aukus4Games = $derived(gamesHistoryStore.gamesHistoryByEvent.get('aukus4') ?? [])
	const aukus3Games = $derived(gamesHistoryStore.gamesHistoryByEvent.get('aukus3') ?? [])
	const aukus2Games = $derived(gamesHistoryStore.gamesHistoryByEvent.get('aukus2') ?? [])
	const aukus1Games = $derived(gamesHistoryStore.gamesHistoryByEvent.get('aukus1') ?? [])

	const aukus5Games = $derived(playersMovesStore.playerMoves)

	$effect(() => {
		if (dialogOpen) {
			const playersFilter = app.myPlayer ? [app.myPlayer.slug] : []
			gamesHistoryStore.searchParams = {
				events: [],
				players: playersFilter,
				title_search: null
			}
			playersMovesStore.queryParams = {
				players: playersFilter,
				search_title: null
			}
		}
	})

	let timer: ReturnType<typeof setTimeout>
	const debounceSearch = (v: string) => {
		clearTimeout(timer)
		if (v.length >= 3 || v.length === 0) {
			timer = setTimeout(() => {
				gamesHistoryStore.searchParams.title_search = v
				playersMovesStore.queryParams.search_title = v
			}, 500)
		}
	}

	const playerFilter = $derived(gamesHistoryStore.searchParams?.players?.[0] ?? 'all')

	function setPlayerFilter(slug: string) {
		if (slug === 'all') {
			gamesHistoryStore.searchParams.players = []
			playersMovesStore.queryParams.players = []
		} else {
			gamesHistoryStore.searchParams.players = [slug]
			playersMovesStore.queryParams.players = [slug]
		}
	}

	const eventFilter = $derived.by(() => {
		if (gamesHistoryStore.searchParams?.events?.length === 1) {
			return gamesHistoryStore.searchParams.events[0]
		}
		return 'all'
	})

	const eventsList = ['aukus1', 'aukus2', 'aukus3', 'aukus4', 'aukus5']

	function setEventFilter(event: string) {
		if (event === 'all') {
			gamesHistoryStore.searchParams.events = ['aukus1', 'aukus2', 'aukus3', 'aukus4']
		} else {
			gamesHistoryStore.searchParams.events = [event]
		}
	}

	const currentGamesDisplay = $derived.by<PlayerMoveItem[]>(() => {
		if (eventFilter !== 'aukus5' && eventFilter !== 'all') {
			return []
		}
		return aukus5Games
	})

	$effect(() => {
		if (!dialogOpen) {
			return
		}

		const historyIds = [...aukus4Games, ...aukus3Games, ...aukus2Games, ...aukus1Games]
			.map((game) => game.igdb_id)
			.filter((id): id is number => id !== null)

		const currentEventIds = aukus5Games
			.map((game) => game.game_id)
			.filter((id): id is number => id !== null)

		const igdbIds = new Set([...historyIds, ...currentEventIds])

		const gamesIdsHistory = [...aukus4Games, ...aukus3Games, ...aukus2Games, ...aukus1Games]
			.map((game) => game.id)
			.slice(0, 50)
		const gamesIdsMoves = aukus5Games.map((game) => game.id).slice(0, 50)

		gamesMatchesStore.gamesMatchParams = {
			igdb_ids: [...igdbIds],
			exclude_ids_moves: gamesIdsMoves,
			exclude_ids_history: gamesIdsHistory,
			exclude_player: undefined
		}
	})

	const isLoading = $derived(
		!gamesHistoryStore.searchIdFrom && gamesHistoryStore.historyQuery.isFetching
	)

	// $inspect(isLoading, 'GamesHistoryDialog isLoading')
	// $inspect($historyQuery.isFetching, ' historyQuery isFetching')
	// $inspect($movesQuery.isFetching, ' movesQuery isFetching')

	const noGames = $derived.by(() => {
		return (
			aukus1Games.length === 0 &&
			aukus2Games.length === 0 &&
			aukus3Games.length === 0 &&
			aukus4Games.length === 0 &&
			currentGamesDisplay.length === 0
		)
	})

	const gameMatchedMergedWithOthers = $derived.by(() => {
		const commonCurrentGames = aukus5Games.map(playerMoveToCommonGame)
		return uniqBy(
			[
				...commonCurrentGames,
				...aukus4Games,
				...aukus3Games,
				...aukus2Games,
				...aukus1Games,
				...gamesMatchesStore.gamesMatched
			],
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
		} else if (event === 'aukus4') {
			url = 'https://aukus4.eventlab.dev'
		}
		window.open(url, '_blank noopener noreferrer')
	}

	function onOpenChange(open: boolean) {
		if (!open) {
			app.navStore.closePage()
		}
	}
</script>

<Dialog bind:open={dialogOpen} {onOpenChange}>
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
			<div class="w-full gap-2">
				<Tabs value={playerFilter} onValueChange={(v) => setPlayerFilter(v)}>
					<TabsList class="flex flex-wrap gap-2">
						<TabsTrigger class="w-fit" value="all">Все</TabsTrigger>
						{#each app.players as player (player.slug)}
							<TabsTrigger class="w-fit" value={player.slug}>
								<PlayerAvatar
									src={player.avatar_link ?? ''}
									name={player.username}
									isOnline={Boolean(player.is_online)}
									size="small"
								/>
								{player.username}
							</TabsTrigger>
						{/each}
					</TabsList>
				</Tabs>
			</div>
			<div class="flex w-full flex-wrap gap-2">
				<Tabs value={eventFilter} onValueChange={(v) => setEventFilter(v)}>
					<TabsList class="flex flex-wrap gap-2">
						<TabsTrigger class="w-fit" value="all">Все</TabsTrigger>
						{#each eventsList as eventName (eventName)}
							<TabsTrigger class="w-fit" value={eventName}>
								{EventTitles[eventName]}
							</TabsTrigger>
						{/each}
					</TabsList>
				</Tabs>
			</div>
			<Input
				type="text"
				placeholder="Поиск по названию (3+ символов)"
				class="mb-4 w-full rounded-xl bg-muted"
				value={gamesHistoryStore.searchParams?.title_search ?? ''}
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

						{#if currentGamesDisplay.length !== 0}
							<div class="p-0 text-center text-3xl">Аукус 5</div>
							{#each currentGamesDisplay as move (move.id)}
								{#if app.playersBySlug.get(move.player_slug) !== undefined}
									{@const matches = gameMatchedMergedWithOthers.filter(
										(g) => g.igdb_id === move.game_id && g.player_nickname !== move.player_slug
									)}
									<GameCard {move} game={playerMoveToCommonGame(move)} matchedGames={matches} />
								{/if}
							{/each}
						{/if}

						{#if aukus4Games.length > 0}
							<div class="flex justify-center">
								<Button variant="link" class="p-0 text-3xl" onclick={() => openLink('aukus3')}>
									Аукус 4
								</Button>
							</div>
							{#each aukus4Games as game (game.id)}
								{#if app.playersBySlug.get(game.player_nickname)}
									{@const matches = gameMatchedMergedWithOthers.filter(
										(g) => g.igdb_id === game.igdb_id && g.player_nickname !== game.player_nickname
									)}
									<GameCard {game} matchedGames={matches} />
								{/if}
							{/each}
						{/if}

						{#if aukus3Games.length > 0}
							<div class="flex justify-center">
								<Button variant="link" class="p-0 text-3xl" onclick={() => openLink('aukus3')}>
									Аукус 3
								</Button>
							</div>
							{#each aukus3Games as game (game.id)}
								{#if app.playersBySlug.get(game.player_nickname)}
									{@const matches = gameMatchedMergedWithOthers.filter(
										(g) => g.igdb_id === game.igdb_id && g.player_nickname !== game.player_nickname
									)}
									<GameCard {game} matchedGames={matches} />
								{/if}
							{/each}
						{/if}

						{#if aukus2Games.length > 0}
							<div class="flex justify-center">
								<Button variant="link" class="p-0 text-3xl" onclick={() => openLink('aukus2')}>
									Аукус 2
								</Button>
							</div>
							{#each aukus2Games as game (game.id)}
								{#if app.playersBySlug.get(game.player_nickname)}
									{@const matches = gameMatchedMergedWithOthers.filter(
										(g) => g.igdb_id === game.igdb_id && g.player_nickname !== game.player_nickname
									)}
									<GameCard {game} matchedGames={matches} />
								{/if}
							{/each}
						{/if}

						{#if aukus1Games.length > 0}
							<div class="flex justify-center">
								<Button variant="link" class="p-0 text-3xl" onclick={() => openLink('aukus1')}>
									Аукус 1
								</Button>
							</div>
							{#each aukus1Games as game (game.id)}
								{#if app.playersBySlug.get(game.player_nickname)}
									{@const matches = gameMatchedMergedWithOthers.filter(
										(g) =>
											g.game_title === game.game_title && g.player_nickname !== game.player_nickname
									)}
									<GameCard {game} matchedGames={matches} />
								{/if}
							{/each}
						{/if}

						{#if gamesHistoryStore.hasMore}
							<div class="flex justify-center">
								<Button onclick={() => gamesHistoryStore.loadMore()}>Загрузить ещё</Button>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</ScrollArea>
	</DialogContent>
</Dialog>
