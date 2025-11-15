<script lang="ts">
	import { LastMapPosition } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { getCellPosition, laddersByCell, snakesByCell } from '$lib/mapUtils'

	const { movementStore, turnState } = getAppManagerContext()
	const { myMovementState, selectedPlayer } = movementStore

	const cells = $derived.by(() => {
		const { startCell, steps } = $myMovementState
		const cells = []
		for (let i = 1; i <= Math.abs(steps); i++) {
			cells.push(steps > 0 ? startCell + i : startCell - i)
		}
		return cells
			.filter((c) => c <= LastMapPosition)
			.map((cell) => ({ id: cell, position: getCellPosition(cell) }))
	})

	const showMinus = $derived($myMovementState.steps < 0)

	function cellType(cellId: number) {
		if (snakesByCell[cellId]) {
			return 'negative'
		}
		if (laddersByCell[cellId]) {
			return 'positive'
		}
		return 'neutral'
	}

	const showMarkers = $derived(
		$turnState === 'selecting-dice' ||
			$turnState === 'dice-results' ||
			$turnState === 'player-map-animation' ||
			$selectedPlayer
	)
</script>

{#if cells && showMarkers}
	{#each cells as cell, idx (idx)}
		<div
			class="absolute w-fit rounded-2xl p-3 text-center data-[variant=negative]:bg-red-500 data-[variant=neutral]:bg-secondary data-[variant=positive]:bg-green-500"
			data-variant={cellType(cell.id)}
			style="top: {cell.position.y + 40}px; left: {cell.position.x + 45}px;"
		>
			<div class="w-[2ch]">{showMinus ? '-' : ''}{idx + 1}</div>
		</div>
	{/each}
{/if}
