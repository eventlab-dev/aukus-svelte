<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { getCellPosition } from '$lib/mapUtils'

	const { movementStore } = getAppManagerContext()
	const { movementParams } = movementStore

	const direction = $derived($movementParams?.direction ?? 'forward')

	const cells = $derived.by(() => {
		if (!$movementParams) return null
		const { startCell, steps, direction } = $movementParams
		const cells = []
		for (let i = 1; i <= Math.abs(steps); i++) {
			cells.push(direction === 'forward' ? startCell + i : startCell - i)
		}
		return cells.map((cell) => getCellPosition(cell))
	})
</script>

{#if $movementParams && cells}
	{#each cells as cell, idx (idx)}
		<div
			class="absolute w-10 rounded-2xl bg-black p-3 text-center"
			style="top: {cell.y + 40}px; left: {cell.x + 45}px; background-color: {direction === 'forward'
				? '#34C759'
				: '#FF3B30'}"
		>
			<div>{idx + 1}</div>
		</div>
	{/each}
{/if}
