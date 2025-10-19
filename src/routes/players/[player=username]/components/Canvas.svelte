<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { Stage, Layer } from 'svelte-konva'
	import CanvasImage from './CanvasImage.svelte'

	const { canvasStore } = getAppManagerContext()
	const { files, editable } = canvasStore

	const canvasMaxSize = 10000

	let container = $state<HTMLDivElement | null>(null)

	const canvasWidth = $derived(Math.min(container?.offsetWidth ?? window.innerWidth, canvasMaxSize))
	const canvasHeight = $derived(
		Math.min(container?.scrollHeight ?? window.innerHeight, canvasMaxSize)
	)
</script>

<div bind:this={container} class="relative z-0 h-full w-full">
	<div
		class="absolute z-20 overflow-hidden"
		style={$editable ? 'pointer-events: all; border: 1px solid cyan' : 'pointer-events: none;'}
	>
		<Stage width={canvasWidth - 2} height={canvasHeight}>
			<Layer>
				<!-- <Rect x={100} y={100} width={400} height={200} fill="blue" /> -->
				{#each $files as file (file.id)}
					<CanvasImage {file} editable={$editable} />
				{/each}
			</Layer>
		</Stage>
	</div>
</div>
