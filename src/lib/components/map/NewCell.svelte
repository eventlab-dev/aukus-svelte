<script lang="ts">
	import { laddersByCell, snakesByCell } from "$lib/mapUtils"
	import { getAppManager } from "$lib/stores/AppManager.svelte"

	
	type Props = {
		cellId: number
		scale?: number
	}

	const { cellId, scale = 1 }: Props = $props()

	const app = getAppManager()
	const { mapStore } = app

	const cell = $derived(mapStore.cellPositionById[cellId])
	const cellTop = $derived(cell.centerY - mapStore.cellSize / 2)
	const cellLeft = $derived(cell.centerX - mapStore.cellSize / 2)
	const cellWidth = $derived(mapStore.cellSize)
	const cellHeight = $derived(mapStore.cellSize)

	const cellType = $derived.by(() => {
		if (snakesByCell[cellId]) {
			return 'snake'
		}
		if (laddersByCell[cellId]) {
			return 'ladder'
		}
		return 'normal'
	})
</script>

<div
	class="absolute rounded-full text-black text-center data-[celltype=snake]:bg-red-400/50 data-[celltype=ladder]:bg-green-400/50"
	style={`left: ${cellLeft * scale}px; top: ${cellTop * scale}px; width: ${cellWidth * scale}px; height: ${cellHeight * scale}px;`}
	data-celltype={cellType}
>
	<div style={`transform: scale(${scale})`} class="hidden pointer-events-none select-none text-5xl flex items-center justify-center h-full">
		{cellId}
	</div>
</div>
