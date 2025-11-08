<script lang="ts">
	import { page } from '$app/state'
	import { fade } from 'svelte/transition'
	import { Button } from './ui/button'
	import { routes } from '$lib/constants'

	const GAP = 3
	const BASE_WIDTH = 180

	const currentRouteIndex = $derived(routes.findIndex((route) => route.url === page.url.pathname))

	let itemsSizes: (HTMLElement | null)[] = $state(new Array(routes.length).fill(null))
	let prevWidthSum = $derived(
		itemsSizes.reduce(
			(acc, item, idx) => (currentRouteIndex > idx ? acc + ((item?.offsetWidth || 0) + GAP) : acc),
			0
		)
	)
	let spanWidth = $derived(itemsSizes[currentRouteIndex]?.offsetWidth ?? BASE_WIDTH)
</script>

<nav
	class="absolute top-3 left-1/2 z-1000 mx-auto h-auto w-fit -translate-x-1/2 rounded-lg bg-card p-[3px] shadow-md"
>
	<div class="relative flex h-full w-fit items-center" style="gap: {GAP}px">
		{#each routes as route, idx (route.title)}
			<Button
				bind:ref={itemsSizes[idx]}
				href={route.url}
				variant="ghost"
				class="leading relative z-20 h-[33px] w-full min-w-[180px] shrink gap-4 px-3 font-semibold text-muted-foreground transition-[color,font-weight] duration-200 select-none hover:bg-transparent hover:text-foreground data-[active=true]:bg-transparent data-[active=true]:font-bold data-[active=true]:text-foreground"
				data-active={currentRouteIndex === idx}
				draggable={false}
			>
				{route.title}
			</Button>
		{/each}
		{#if currentRouteIndex > -1}
			<span
				class="pointer-events-none absolute top-0 left-0 z-10 h-full translate-y-1/2 rounded-md bg-primary py-2 transition-all duration-300 ease-in-out"
				style="width: {spanWidth}px; translate: {prevWidthSum}px 0;"
				transition:fade={{ duration: 200 }}
			></span>
		{/if}
	</div>
</nav>
