<script lang="ts">
	import PageContainer from '$lib/components/PageContainer.svelte'
	import { Input } from '$lib/components/ui/input'
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

	const aukus5Games = $derived(playersMovesStore.playerMoves)

	let loading = $state(true)

	setTimeout(() => {
		loading = false
	}, 200)

	// Initialize search params on component mount
	$effect(() => {
		const playersFilter = app.navStore.pageParams.playerSlug
			? [app.navStore.pageParams.playerSlug]
			: app.myPlayer
				? [app.myPlayer.slug]
				: []

		gamesHistoryStore.searchParams = {
			events: [],
			players: playersFilter,
			title_search: null
		}
		playersMovesStore.queryParams = {
			players: playersFilter,
			search_title: null
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

	const historyEventsList = ['aukus4', 'aukus3', 'aukus2', 'aukus1']
	const eventsList = ['aukus5', ...historyEventsList]

	function setEventFilter(event: string) {
		if (event === 'all') {
			gamesHistoryStore.searchParams.events = historyEventsList
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

	const historyGames = $derived(
		historyEventsList.flatMap((e) => gamesHistoryStore.gamesHistoryByEvent.get(e) ?? [])
	)

	$effect(() => {
		const historyIgdbIds = historyGames
			.map((game) => game.igdb_id)
			.filter((id): id is number => id !== null)

		const currentEventIgdbIds = aukus5Games
			.map((game) => game.game_id)
			.filter((id): id is number => id !== null)

		const igdbIds = new Set([...historyIgdbIds, ...currentEventIgdbIds])

		const gamesIdsHistory = historyGames.map((game) => game.id).slice(0, 50)
		const gamesIdsMoves = aukus5Games.map((game) => game.id).slice(0, 50)

		gamesMatchesStore.gamesMatchParams = {
			igdb_ids: [...igdbIds],
			exclude_ids_moves: gamesIdsMoves,
			exclude_ids_history: gamesIdsHistory,
			exclude_player: undefined
		}
	})

	const isLoading = $derived(
		loading || (!gamesHistoryStore.searchIdFrom && gamesHistoryStore.historyQuery.isFetching)
	)

	// $inspect(isLoading, 'GamesHistoryDialog isLoading')
	// $inspect($historyQuery.isFetching, ' historyQuery isFetching')
	// $inspect($movesQuery.isFetching, ' movesQuery isFetching')

	const noGames = $derived(historyGames.length === 0 && currentGamesDisplay.length === 0)

	const gameMatchedMergedWithOthers = $derived.by(() => {
		const commonCurrentGames = aukus5Games.map(playerMoveToCommonGame)
		return uniqBy(
			[...commonCurrentGames, ...historyGames, ...gamesMatchesStore.gamesMatched],
			(g) => `${g.event_name}-${g.id}`
		)
	})

	function openLink(event: string) {
		let url = ''
		switch (event) {
			case 'aukus1':
				url =
					'https://docs.google.com/spreadsheets/d/1iGjS41dpxbgjtMTGODZ-j3OG9eMDaZh5kBRiWH-FPk0/edit?gid=1235582040#gid=1235582040'
				break
			case 'aukus2':
				url =
					'https://docs.google.com/spreadsheets/d/16JxvqzWmZgigHVBhsxHQsP4ElpXZ2sl3XbslmkW-m88/edit?gid=1235582040#gid=1235582040'
				break
			case 'aukus3':
				url = 'https://aukus3.eventlab.dev'
				break
			case 'aukus4':
				url = 'https://aukus4.eventlab.dev'
				break
		}
		if (url) {
			window.open(url, '_blank noopener noreferrer')
		}
	}
</script>

<PageContainer bottomSpace={false}>
	<div class="flex flex-col items-center gap-5 pt-16">
		<div class="flex w-full max-w-[800px] flex-col gap-5">
			<div class="flex justify-center">
				<Tabs value={playerFilter} onValueChange={(v) => setPlayerFilter(v)}>
					<TabsList class="flex flex-wrap gap-2">
						<TabsTrigger value="all" class="uppercase">Все</TabsTrigger>
						{#each app.players as player (player.slug)}
							<TabsTrigger value={player.slug}>
								<PlayerAvatar
									src={player.avatar_link ?? ''}
									name={player.username}
									isOnline={Boolean(player.is_online)}
									size="small"
								/>
								<p class="uppercase">{player.username}</p>
							</TabsTrigger>
						{/each}
					</TabsList>
				</Tabs>
			</div>
			<div class="flex justify-center">
				<Tabs value={eventFilter} onValueChange={(v) => setEventFilter(v)}>
					<TabsList class="flex flex-wrap gap-2">
						<TabsTrigger value="all" class="uppercase">Все</TabsTrigger>
						{#each eventsList as eventName (eventName)}
							<TabsTrigger value={eventName} class="uppercase">
								{EventTitles[eventName]}
							</TabsTrigger>
						{/each}
					</TabsList>
				</Tabs>
			</div>
			<Input
				type="text"
				placeholder="Поиск по названию (3+ символов)"
				class="mb-4 w-full rounded-xl bg-primary"
				value={gamesHistoryStore.searchParams?.title_search ?? ''}
				oninput={(e) => debounceSearch((e.target as HTMLInputElement).value)}
			/>
		</div>
		<div class="mt-5 mb-80 w-full max-w-[800px]">
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
						<div class="p-0 text-center text-3xl font-extrabold">Аукус 5</div>
						{#each currentGamesDisplay as move (move.id)}
							{#if app.playersBySlug.get(move.player_slug) !== undefined}
								{@const matches = gameMatchedMergedWithOthers.filter(
									(g) => g.igdb_id === move.game_id && g.player_nickname !== move.player_slug
								)}
								<GameCard
									{move}
									game={playerMoveToCommonGame(move)}
									matchedGames={matches}
									showEvent
									showPlayer
								/>
							{/if}
						{/each}
					{/if}

					{#each historyGames as game, idx (game.id)}
						{@const eventChanged = game.event_name !== historyGames[idx - 1]?.event_name}
						{#if eventChanged}
							<div class="mt-5 flex justify-center">
								<Button
									variant="link"
									class="p-0 text-3xl font-extrabold uppercase"
									onclick={() => openLink(game.event_name)}
								>
									{game.event_name}
								</Button>
							</div>
						{/if}
						{@const matches = gameMatchedMergedWithOthers.filter(
							(g) => g.igdb_id === game.igdb_id && g.player_nickname !== game.player_nickname
						)}
						<GameCard {game} matchedGames={matches} showEvent showPlayer />
					{/each}

					{#if gamesHistoryStore.hasMore}
						<div class="flex justify-center">
							<Button onclick={() => gamesHistoryStore.loadMore()}>Загрузить ещё</Button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</PageContainer>
