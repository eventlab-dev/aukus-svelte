<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	let {
		from,
		to,
		hide = false
	} = $props<{
		from: number
		to: number
		hide?: boolean
	}>()

	const { mapStore } = getAppManagerContext()

	const cellFromPos = $derived(mapStore.cellPositionById[from])
	const cellToPos = $derived(mapStore.cellPositionById[to])

	// Derived values
	const topPoint = $derived(Math.min(cellToPos.y, cellFromPos.y))
	const bottomPoint = $derived(Math.max(cellFromPos.y1, cellToPos.y1))

	const leftPoint = $derived(Math.min(cellToPos.x, cellFromPos.x))
	const rightPoint = $derived(Math.max(cellToPos.x1, cellFromPos.x1))

	const arrowGoesToRight = $derived(cellToPos.x > cellFromPos.x)
	const arrowGoesStraight = $derived(cellToPos.x === cellFromPos.x)

	const isSnake = $derived(from > to)
	const width = $derived(Math.abs(rightPoint - leftPoint))
	const height = $derived(Math.abs(topPoint - bottomPoint))

	const fromX = $derived(
		arrowGoesStraight || arrowGoesToRight ? mapStore.cellSize / 2 : width - mapStore.cellSize / 2
	)
	const fromY = $derived(isSnake ? mapStore.cellSize / 2 : height - mapStore.cellSize / 2)

	const toX = $derived(
		arrowGoesStraight ? mapStore.cellSize / 2 : arrowGoesToRight ? width - mapStore.cellSize + 10 : mapStore.cellSize - 10
	)
	const toY = $derived(isSnake ? height - mapStore.cellSize - 10 : mapStore.cellSize - 10)
</script>

<svg
	id="map-arrow-{from}-{to}"
	class=""
	{width}
	height={height + 0}
	style="
			position: absolute;
			top: {topPoint}px;
			left: {leftPoint}px;
			pointer-events: none;
			display: {hide ? 'none' : 'block'};
		"
>
	<line
		id="arrow-line-{from}-{to}"
		x1={fromX}
		y1={fromY}
		x2={toX}
		y2={toY + 10}
		stroke="rgba(0,0,0,0.7)"
		stroke-width="3"
		marker-start={isSnake ? 'url(#red-arrow-start)' : 'url(#green-arrow-start)'}
		marker-end={isSnake ? 'url(#red-arrow-end)' : 'url(#green-arrow-end)'}
	/>
</svg>
