<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

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
		<Button class="w-[220px]" variant="secondary" onclick={nextPage}
			>Дальше ({pageId + 1}/{pagesAmount}) {'->'}</Button
		>
	{/if}
</div>
