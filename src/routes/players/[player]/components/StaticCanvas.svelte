<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import StaticImage from './StaticImage.svelte'

	type Props = {
		contentCenter: number
	}

	const canvasMaxWidth = 2500

	const { contentCenter }: Props = $props()

	const { canvasStore } = getAppManagerContext()
	const { displayImages } = canvasStore

	// const canvasWidth = 2500 // $derived(Math.min(window.innerWidth - 20, canvasMaxWidth))

	let container = $state<HTMLDivElement | null>(null)
</script>

<div
	bind:this={container}
	class="absolute top-0 z-0 min-h-screen transform overflow-x-auto"
	style="width: {canvasMaxWidth}px;"
>
	{#each $displayImages as image (image.id)}
		<StaticImage file={image} centerX={contentCenter} />
	{/each}
</div>
