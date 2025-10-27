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

	const { gamesHistoryStore, players, playersBySlug } = getAppManagerContext()
	const { gamesHistory, searchParams, historyQuery } = gamesHistoryStore

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
</script>

<Dialog>
	<DialogTrigger>
		<SearchIcon /> История игр
	</DialogTrigger>
	<DialogContent
		class="flex h-[80vh] w-[750px] flex-col text-primary-foreground selection:bg-foreground selection:text-background"
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
			<Input
				type="text"
				placeholder="Поиск по названию (3+ символов)"
				class="mb-4 w-full rounded-[4px] bg-muted"
				oninput={(e) => debounceSearch((e.target as HTMLInputElement).value)}
			/>
			<ScrollArea class="h-[70vh] w-full" type="always">
				<div class="mt-10 mb-30">
					{#if $gamesHistory.length === 0}
						{#if $historyQuery.isPending}
							<div class="mt-40 flex justify-center">
								<LoaderCircle class="inline size-20 animate-spin" />
							</div>
						{:else}
							<div class="text-center text-sm text-muted-foreground">Игр не найдено</div>
						{/if}
					{:else}
						<div class="flex flex-col gap-10">
							{#each $gamesHistory as game (game.id)}
								{#if $playersBySlug[game.player_name] !== undefined}
									<GameCard {game} />
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			</ScrollArea>
		</div>
	</DialogContent>
</Dialog>
