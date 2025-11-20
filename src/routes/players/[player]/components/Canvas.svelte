<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { Stage, Layer, type KonvaMouseEvent } from 'svelte-konva'
	import CanvasImage from './CanvasImage.svelte'

	type Props = {
		contentCenter: number
		contentHeight: number
	}

	const { contentCenter, contentHeight }: Props = $props()

	const { canvasStore } = getAppManagerContext()
	const { displayImages, selectImage } = canvasStore

	const canvasMaxSize = 10000

	let container = $state<HTMLDivElement | null>(null)

	const canvasWidth = $derived(Math.min(container?.offsetWidth ?? window.innerWidth, canvasMaxSize))
	const canvasHeight = $derived(Math.min(contentHeight, canvasMaxSize))

	function handleStageClick(event: KonvaMouseEvent) {
		if (event.target === event.target.getStage()) {
			selectImage(null)
		}
	}
</script>

<div
	bind:this={container}
	class="absolute inset-0 min-h-screen overflow-hidden"
	style="border: 1px solid cyan; z-index: 100; width: {contentCenter * 2}px;"
>
	<Stage width={canvasWidth - 2} height={canvasHeight} onclick={handleStageClick}>
		<Layer>
			{#each $displayImages as img (img.id)}
				<CanvasImage file={img} editable centerX={contentCenter} />
			{/each}
		</Layer>
	</Stage>
</div>
