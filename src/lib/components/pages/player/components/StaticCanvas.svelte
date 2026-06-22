<script lang="ts">
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import StaticImage from './StaticImage.svelte'

	type Props = {
		canvasCenter: number
		contentHeight: number
	}

	const canvasMaxWidth = 2500

	const { canvasCenter, contentHeight }: Props = $props()

	const app = getAppManager()
	const { canvasStore } = app

	let container = $state<HTMLDivElement | null>(null)
</script>

<div
	bind:this={container}
	class="absolute top-0 z-0 min-h-screen transform overflow-x-auto"
	style="width: {canvasMaxWidth}px; height: {contentHeight}px;"
>
	{#each canvasStore.displayImages as image (image.id)}
		<StaticImage file={image} centerX={canvasCenter} />
	{/each}
</div>
