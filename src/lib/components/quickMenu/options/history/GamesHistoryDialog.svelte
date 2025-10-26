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
	import GameCard from './GameCard.svelte'

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
		<div>
			<Input
				type="text"
				placeholder="Поиск по названию (3+ символов)"
				class="mb-4 w-full rounded-[4px] bg-muted"
				oninput={(e) => debounceSearch((e.target as HTMLInputElement).value)}
			/>
			{#if $gamesHistory.length === 0}
				{#if $historyQuery.isPending}
					<div class="py-10 text-center text-sm text-muted-foreground">Загрузка...</div>
				{:else}
					<div class="py-10 text-center text-sm text-muted-foreground">Игр не найдено</div>
				{/if}
			{:else}
				<div class="max-h-[400px] space-y-3 overflow-y-auto pr-1">
					{#each $gamesHistory as game (game.id)}
						<GameCard {game} />
					{/each}
				</div>
			{/if}
		</div>
	</DialogContent>
</Dialog>
