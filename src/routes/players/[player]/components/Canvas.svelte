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

	const canvasMaxHeight = 10000
	const canvasMaxWidth = 2500

	let container = $state<HTMLDivElement | null>(null)

	const canvasWidth = $derived(canvasMaxWidth)
	const canvasHeight = $derived(Math.min(contentHeight, canvasMaxHeight))

	// $inspect('canvas-width', window.innerWidth, canvasWidth)

	function handleStageClick(event: KonvaMouseEvent) {
		if (event.target === event.target.getStage()) {
			selectImage(null)
		}
	}
</script>

<div
	bind:this={container}
	class="absolute inset-0 min-h-screen overflow-hidden"
	style="border: 1px solid cyan; z-index: 100; width: {canvasWidth + 2}px;"
>
	<Stage width={canvasWidth - 2} height={canvasHeight} onclick={handleStageClick}>
		<Layer>
			{#each $displayImages as img (img.id)}
				<CanvasImage file={img} editable centerX={contentCenter} />
			{/each}
		</Layer>
	</Stage>
</div>
