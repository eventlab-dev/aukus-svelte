<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import TotalStats from './components/TotalStats.svelte'
	import PlayerStats from './components/PlayerStats.svelte'
	import SnowflakeIcon from '$lib/components/icons/SnowflakeIcon.svelte'
	import { FINAL_VIDEO_POSTER } from '$lib/constants'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
	const { eventDataStore } = app

	const videoFinalUrl = $derived(
		typeof eventDataStore.eventSettings?.video_final_url === 'string'
			? eventDataStore.eventSettings.video_final_url
			: null
	)

	let pageId = $state(0)

	const pagesAmount = $derived(app.playersInOrder.length + 2)

	function nextPage() {
		pageId = pageId + 1
	}

	function prevPage() {
		pageId -= 1
	}

	const onFirstPage = $derived(pageId === 0)
	const onLastPage = $derived(pageId + 1 === pagesAmount)

	const currentPlayer = $derived(app.playersInOrder[app.playersInOrder.length - pageId] ?? null)

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
			<Button class="w-[220px]" variant="secondary" onclick={prevPage}>&lt;- Назад</Button>
		{/if}
		<Button class="w-[220px]" variant="secondary" href="/">На главную</Button>
		{#if onLastPage}
			<div class="w-[220px]"></div>
		{:else}
			<Button class="w-[220px]" variant="secondary" onclick={nextPage}>
				Дальше ({pageId + 1}/{pagesAmount}) -&gt;
			</Button>
		{/if}
	</div>
</div>

<div class="relative z-50 mb-[100px]">
	{#if pageId === 0}
		<div class="mt-[220px] flex justify-center">
			<TotalStats />
		</div>
	{:else if currentPlayer}
		<div class="mt-[100px]">
			<PlayerStats player={currentPlayer} position={app.playersInOrder.length - pageId + 1} />
		</div>
	{:else if pageId === pagesAmount - 1}
		<div class="mt-[100px] flex justify-center">
			{#if videoFinalUrl}
				<div class="flex flex-col items-center gap-6">
					<video
						class="rounded-xl shadow-2xl"
						width="1280"
						height="720"
						controls
						poster={FINAL_VIDEO_POSTER}
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
		<div
			class="absolute bottom-[-200px] left-[-180px] z-10 h-[330px] w-fit overflow-hidden blur-2xl"
		>
			<SnowflakeIcon class="size-[500px]" {color} />
		</div>
	{/if}
</div>
