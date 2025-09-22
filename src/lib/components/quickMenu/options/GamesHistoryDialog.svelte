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

	const { gamesHistoryStore } = getAppManagerContext()
	const { gamesHistory, search } = gamesHistoryStore

	let timer: number = 0
	const debounceSearch = (v: string) => {
		clearTimeout(timer)
		timer = setTimeout(() => {
			search.set(v)
		}, 500)
	}
</script>

<Dialog>
	<DialogTrigger>
		<SearchIcon /> История игр
	</DialogTrigger>
	<DialogContent
		class="w-[550px]  text-primary-foreground selection:bg-foreground selection:text-background"
	>
		<DialogHeader class="mb-[74px] gap-3">
			<DialogTitle class="text-2xl font-bold">История игр</DialogTitle>
		</DialogHeader>
		<Input
			type="text"
			placeholder="Поиск по названию"
			class="mb-4 w-full rounded-[4px] bg-muted"
			oninput={(e) => debounceSearch((e.target as HTMLInputElement).value)}
		/>
		{#if $gamesHistory.length === 0}
			<div class="py-10 text-center text-sm text-muted-foreground">Нет игр в истории</div>
		{:else}
			<div class="max-h-[400px] space-y-3 overflow-y-auto pr-1">
				{#each $gamesHistory as game (game.id)}
					<div class="rounded-[4px] bg-muted p-3">
						<div class="text-sm font-medium">{game.game_title}</div>
					</div>
				{/each}
			</div>
		{/if}
	</DialogContent>
</Dialog>
