<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	type Props = {
		cellId: number
		scale?: number
	}

	const { cellId, scale = 1 }: Props = $props()

	const { mapStore } = getAppManagerContext()

	const cell = $derived(mapStore.cellPositionById[cellId])
	const cellTop = $derived(cell.centerY - mapStore.cellSize / 2)
	const cellLeft = $derived(cell.centerX - mapStore.cellSize / 2)
	const cellWidth = $derived(mapStore.cellSize)
	const cellHeight = $derived(mapStore.cellSize)
</script>

<div
	class="absolute border-2 border-black rounded-full text-black text-center"
	style={`left: ${cellLeft * scale}px; top: ${cellTop * scale}px; width: ${cellWidth * scale}px; height: ${cellHeight * scale}px;`}
>
	<div style={`transform: scale(${scale})`} class="pointer-events-none select-none text-5xl flex items-center justify-center h-full">
		{cellId}
	</div>
</div>
