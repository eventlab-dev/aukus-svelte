<script lang="ts">
	import { LastMapPosition } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { laddersByCell, snakesByCell } from '$lib/mapUtils'

	const { movementStore, turnState, mapStore } = getAppManagerContext()
	const { myMovementState, selectedPlayer } = movementStore

	const cells = $derived.by(() => {
		const { startCell, steps, minSteps } = $myMovementState
		const cells = []
		for (let i = Math.abs(minSteps); i <= Math.abs(steps); i++) {
			cells.push(steps > 0 ? startCell + i : startCell - i)
		}
		return cells
			.filter((c) => c <= LastMapPosition)
			.map((cell) => ({ id: cell, position: mapStore.cellPositionById[cell] }))
	})

	const showMinus = $derived($myMovementState.steps < 0)

	function cellType(startCell: number, cellId: number) {
		if (snakesByCell[cellId]) {
			return 'negative'
		}
		if (laddersByCell[cellId]) {
			return 'positive'
		}
		if (startCell < 81 && cellId > 81) {
			return 'slow'
		}
		return 'neutral'
	}

	const showMarkers = $derived(
		$turnState === 'selecting-dice' ||
			$turnState === 'dice-results' ||
			$turnState === 'player-map-animation' ||
			$selectedPlayer
	)

	const startCell = $derived.by(() => {
		if ($myMovementState) {
			return $myMovementState.startCell
		}
		if ($selectedPlayer) {
			return $selectedPlayer.map_position
		}
		return null
	})
</script>

{#if cells && showMarkers && startCell}
	{#each cells as cell, idx (idx)}
		<div
			class="absolute flex items-center justify-center rounded-2xl p-3 text-center data-[variant=negative]:bg-red-500 data-[variant=neutral]:bg-secondary data-[variant=positive]:bg-green-500 data-[variant=slow]:bg-yellow-700"
			data-variant={cellType(startCell, cell.id)}
			style="top: {cell.position.centerY - 32}px; left: {cell.position.centerX - 34}px;"
		>
			<div class="w-[2ch] text-center text-4xl">
				{showMinus ? '-' : ''}{idx + Math.abs($myMovementState.minSteps)}
			</div>
		</div>
	{/each}
{/if}
