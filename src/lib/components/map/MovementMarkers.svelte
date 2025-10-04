<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { getCellPosition, laddersByCell, snakesByCell } from '$lib/mapUtils'

	const { movementStore } = getAppManagerContext()
	const { movementState } = movementStore

	const cells = $derived.by(() => {
		const { startCell, steps, direction } = $movementState
		const cells = []
		for (let i = 1; i <= Math.abs(steps); i++) {
			cells.push(direction === 'forward' ? startCell + i : startCell - i)
		}
		return cells.map((cell) => ({ id: cell, position: getCellPosition(cell) }))
	})

	function cellType(cellId: number) {
		if (snakesByCell[cellId]) {
			return 'negative'
		}
		if (laddersByCell[cellId]) {
			return 'positive'
		}
		return 'neutral'
	}
</script>

{#if $movementState.state !== 'finished' && cells}
	{#each cells as cell, idx (idx)}
		<div
			class="absolute w-10 rounded-2xl p-3 text-center data-[variant=negative]:bg-red-500 data-[variant=neutral]:bg-secondary data-[variant=positive]:bg-green-500"
			data-variant={cellType(cell.id)}
			style="top: {cell.position.y + 40}px; left: {cell.position.x + 45}px;"
		>
			<div>{idx + 1}</div>
		</div>
	{/each}
{/if}
