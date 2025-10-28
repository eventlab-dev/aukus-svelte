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

	const { gamesHistoryStore, players, playersBySlug } = getAppManagerContext()
	const { gamesHistoryByEvent, searchParams, historyQuery } = gamesHistoryStore

	const hasNoGames = $derived(Object.keys($gamesHistoryByEvent).length === 0)

	const aukus3Games = $derived($gamesHistoryByEvent['aukus3'] ?? [])
	const aukus2Games = $derived($gamesHistoryByEvent['aukus2'] ?? [])
	const aukus1Games = $derived($gamesHistoryByEvent['aukus1'] ?? [])

	let timer: number = 0
	const debounceSearch = (v: string) => {
		clearTimeout(timer)
		if (v.length >= 3 || v.length === 0) {
			timer = setTimeout(() => {
				searchParams.update((p) => ({ ...p, title_search: v }))
			}, 500)
		}
	}

	const selectedPlayer = $derived($searchParams.player_name)

	function selectPlayer(_: boolean, slug: string) {
		if (selectedPlayer === slug) {
			searchParams.update((p) => ({ ...p, player_name: null }))
		} else {
			searchParams.update((p) => ({ ...p, player_name: slug }))
		}
	}

	const selectedEvent = $derived.by(() => {
		if ($searchParams.events.length === 1) {
			return $searchParams.events[0]
		}
		return null
	})

	const eventsList: EventName[] = ['aukus1', 'aukus2', 'aukus3']

	function selectEvent(_: boolean, event: EventName) {
		if (selectedEvent === event) {
			searchParams.update((p) => ({ ...p, events: ['aukus1', 'aukus2', 'aukus3'] }))
		} else {
			searchParams.update((p) => ({ ...p, events: [event] }))
		}
	}

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

<Dialog>
	<DialogTrigger>
		<SearchIcon /> История игр
	</DialogTrigger>
	<DialogContent
		class="flex h-[80vh] w-[750px] flex-col overflow-hidden text-primary-foreground selection:bg-foreground selection:text-background"
	>
		<DialogHeader class="gap-3">
			<DialogTitle class="text-2xl font-bold">История игр</DialogTitle>
		</DialogHeader>
		<div class="mt-10 flex flex-col gap-5">
			<div class="flex w-full flex-wrap gap-2">
				{#each $players as player (player.slug)}
					<Toggle
						variant="outline"
						bind:pressed={() => player.slug === selectedPlayer, (v) => selectPlayer(v, player.slug)}
						class="cursor-pointer"
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
						variant="outline"
						bind:pressed={() => eventName === selectedEvent, (v) => selectEvent(v, eventName)}
						class="cursor-pointer"
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
				class="mb-4 w-full rounded-[4px] bg-muted"
				oninput={(e) => debounceSearch((e.target as HTMLInputElement).value)}
			/>
		</div>
		<ScrollArea class="h-full w-full flex-1" type="always">
			<div class="mt-10 mb-80">
				{#if hasNoGames}
					{#if $historyQuery.isPending}
						<div class="mt-40 flex justify-center">
							<LoaderCircle class="inline size-20 animate-spin" />
						</div>
					{:else}
						<div class="text-center text-sm text-muted-foreground">Игр не найдено</div>
					{/if}
				{:else}
					<div class="flex flex-col gap-10">
						<Button variant="link" class="p-0 text-3xl" onclick={() => openLink('aukus3')}>
							Аукус 3
						</Button>
						{#if aukus3Games.length === 0}
							<div class="text-center text-sm text-muted-foreground">Игр не найдено</div>
						{:else}
							{#each aukus3Games as game (game.id)}
								{#if $playersBySlug[game.player_name] !== undefined}
									<GameCard {game} />
								{/if}
							{/each}
						{/if}
						<Button variant="link" class="p-0 text-3xl" onclick={() => openLink('aukus2')}>
							Аукус 2
						</Button>
						{#if aukus2Games.length === 0}
							<div class="text-center text-sm text-muted-foreground">Игр не найдено</div>
						{:else}
							{#each aukus2Games as game (game.id)}
								{#if $playersBySlug[game.player_name] !== undefined}
									<GameCard {game} />
								{/if}
							{/each}
						{/if}
						<Button variant="link" class="p-0 text-3xl" onclick={() => openLink('aukus1')}>
							Аукус 1
						</Button>
						{#if aukus1Games.length === 0}
							<div class="text-center text-sm text-muted-foreground">Игр не найдено</div>
						{:else}
							{#each aukus1Games as game (game.id)}
								{#if $playersBySlug[game.player_name] !== undefined}
									<GameCard {game} />
								{/if}
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		</ScrollArea>
	</DialogContent>
</Dialog>
