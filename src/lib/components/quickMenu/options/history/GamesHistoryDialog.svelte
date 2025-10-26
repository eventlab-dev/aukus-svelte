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

	const { gamesHistoryStore } = getAppManagerContext()
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

	$inspect($gamesHistory)
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
		<div class="mt-10">
			<ScrollArea class="h-[70vh] w-full" type="always">
				<Input
					type="text"
					placeholder="Поиск по названию (3+ символов)"
					class="mb-4 w-full rounded-[4px] bg-muted"
					oninput={(e) => debounceSearch((e.target as HTMLInputElement).value)}
				/>
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
								<GameCard {game} />
							{/each}
						</div>
					{/if}
				</div>
			</ScrollArea>
		</div>
	</DialogContent>
</Dialog>
