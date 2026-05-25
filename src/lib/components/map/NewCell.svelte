<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	type Props = {
		cellId: number
		scale?: number
	}

	const { cellId, scale = 1 }: Props = $props()

	const { mapStore } = getAppManagerContext()

	const cell = $derived(mapStore.cellPositions[cellId])
	const cellTop = $derived(cell.centerY - mapStore.cellHeight / 2)
	const cellLeft = $derived(cell.centerX - mapStore.cellWidth / 2)
	const cellWidth = $derived(mapStore.cellWidth)
	const cellHeight = $derived(mapStore.cellHeight)
</script>

<div
	class="absolute border-2 border-black rounded-full text-black text-center"
	style={`left: ${cellLeft * scale}px; top: ${cellTop * scale}px; width: ${cellWidth * scale}px; height: ${cellHeight * scale}px; transform: scale(${scale});`}
>
	{cellId}
</div>
