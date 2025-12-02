<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import TotalStats from './components/TotalStats.svelte'
	import StatsCards from './components/StatsCards.svelte'

	const { playersInOrder } = getAppManagerContext()

	let pageId = $state(0)

	const pagesAmount = $derived($playersInOrder.length + 2)

	function nextPage() {
		pageId = pageId + 1
	}

	function prevPage() {
		pageId -= 1
	}

	const onFirstPage = $derived(pageId === 0)
	const onLastPage = $derived(pageId + 1 === pagesAmount)

	const currentPlayer = $derived($playersInOrder[$playersInOrder.length - pageId] ?? null)

	const playerStats = $derived.by(() => {
		if (currentPlayer) {
			return [{ title: 'Всего', value: '100' }]
		}
		return []
	})
</script>

<div class="flex w-full justify-between px-4">
	{#if onFirstPage}
		<div class="w-[220px]"></div>
	{:else}
		<Button class="w-[220px]" variant="secondary" onclick={prevPage}>{'<-'} Назад</Button>
	{/if}
	<Button class="w-[220px]" variant="secondary" href="/">На главную</Button>
	{#if onLastPage}
		<div class="w-[220px]"></div>
	{:else}
		<Button class="w-[220px]" variant="secondary" onclick={nextPage}>
			Дальше ({pageId + 1}/{pagesAmount}) {'->'}
		</Button>
	{/if}
</div>

{#if pageId === 0}
	<div class="mt-[220px] flex justify-center">
		<TotalStats />
	</div>
{:else if currentPlayer}
	<div class="mt-[100px] flex flex-col justify-center">
		<div class="mb-[20px] text-center">
			<div class="text-xl font-bold italic">{$playersInOrder.length - pageId + 1}-ое место</div>
			<div class="text-6xl font-bold">
				{currentPlayer.first_name}
				{currentPlayer.username}
			</div>
		</div>
		<div class="flex max-w-[1100px] justify-center">
			<StatsCards stats={playerStats} />
		</div>
	</div>
{:else if pageId === pagesAmount - 1}
	<div class="mt-[200px] flex justify-center">
		<div class="text-3xl">Титры</div>
	</div>
{/if}
