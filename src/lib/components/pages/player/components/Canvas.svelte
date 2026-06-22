<script lang="ts">
	import { Stage, Layer, type KonvaMouseEvent } from 'svelte-konva'
	import CanvasImage from './CanvasImage.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	type Props = {
		canvasCenter: number
		contentHeight: number
	}

	const { canvasCenter, contentHeight }: Props = $props()

	const app = getAppManager()
	const { canvasStore } = app

	const canvasMaxHeight = 10000
	const canvasMaxWidth = 2500

	let container = $state<HTMLDivElement | null>(null)

	const canvasWidth = $derived(canvasMaxWidth)
	const canvasHeight = $derived(Math.min(contentHeight, canvasMaxHeight))

	function handleStageClick(event: KonvaMouseEvent) {
		if (event.target === event.target.getStage()) {
			canvasStore.selectImage(null)
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
			{#each canvasStore.displayImages as img (img.id)}
				<CanvasImage file={img} editable centerX={canvasCenter} />
			{/each}
		</Layer>
	</Stage>
</div>
