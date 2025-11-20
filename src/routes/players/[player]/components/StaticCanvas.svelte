<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import StaticImage from './StaticImage.svelte'

	type Props = {
		contentCenter: number
	}

	const { contentCenter }: Props = $props()

	const { canvasStore } = getAppManagerContext()
	const { displayImages } = canvasStore

	let container = $state<HTMLDivElement | null>(null)
</script>

<div bind:this={container} class="absolute inset-0 z-0 min-h-screen overflow-x-auto">
	{#each $displayImages as image (image.id)}
		<StaticImage file={image} centerX={contentCenter} />
	{/each}
</div>
