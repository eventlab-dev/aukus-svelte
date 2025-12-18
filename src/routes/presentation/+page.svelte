<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import TotalStats from './components/TotalStats.svelte'
	import PlayerStats from './components/PlayerStats.svelte'
	import SnowflakeIcon from '$lib/components/icons/SnowflakeIcon.svelte'

	const { playersInOrder, eventDataStore } = getAppManagerContext()
	const { eventSettings } = eventDataStore

	const videoFinalUrl = $derived(
		typeof $eventSettings?.video_final_url === 'string' ? $eventSettings.video_final_url : null
	)

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

	const color = $derived(currentPlayer?.color ?? 'oklch(0.56 0.23 279.32)')

	const showImages = $derived(pageId < pagesAmount - 1)
</script>

<div class="relative">
	{#if showImages}
		<div class="absolute top-[-500px] right-[-400px] z-10 w-fit blur-3xl">
			<SnowflakeIcon class="size-[1000px]" {color} />
		</div>
	{/if}
	<div class="relative z-50 flex w-full justify-between px-4">
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
</div>

{#if pageId === 0}
	<div class="mt-[220px] flex justify-center">
		<TotalStats />
	</div>
{:else if currentPlayer}
	<PlayerStats player={currentPlayer} position={$playersInOrder.length - pageId + 1} />
{:else if pageId === pagesAmount - 1}
	<div class="mt-[100px] flex justify-center">
		{#if videoFinalUrl}
			<div class="flex flex-col items-center gap-6">
				<video
					class="rounded-xl shadow-2xl"
					width="1280"
					height="720"
					controls
					autoplay
					src={videoFinalUrl}
				>
					<track kind="captions" />
				</video>
			</div>
		{:else}
			<div class="text-3xl">Титры</div>
		{/if}
	</div>
{/if}

{#if showImages}
	<div class="absolute bottom-[-200px] left-[-200px] z-10 w-fit blur-2xl">
		<SnowflakeIcon class="size-[500px]" {color} />
	</div>
{/if}
