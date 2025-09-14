<script lang="ts">
	import { CellSize, getCellPosition } from '$lib/mapUtils';

	let {
		from,
		to,
		hide = false
	} = $props<{
		from: number;
		to: number;
		hide?: boolean;
	}>();

	const cellFromPos = $derived(getCellPosition(from));
	const cellToPos = $derived(getCellPosition(to));

	// Derived values
	const topPoint = $derived(Math.min(cellToPos.y, cellFromPos.y));
	const bottomPoint = $derived(Math.max(cellFromPos.y1, cellToPos.y1));

	const leftPoint = $derived(Math.min(cellToPos.x, cellFromPos.x));
	const rightPoint = $derived(Math.max(cellToPos.x1, cellFromPos.x1));

	const arrowGoesToRight = $derived(cellToPos.x > cellFromPos.x);
	const arrowGoesStraight = $derived(cellToPos.x === cellFromPos.x);

	const isSnake = $derived(from > to);
	const width = $derived(Math.abs(rightPoint - leftPoint));
	const height = $derived(Math.abs(topPoint - bottomPoint));

	const fromX = $derived(
		arrowGoesStraight || arrowGoesToRight ? CellSize / 2 : width - CellSize / 2
	);
	const fromY = $derived(isSnake ? CellSize / 2 : height - CellSize / 2);

	const toX = $derived(
		arrowGoesStraight ? CellSize / 2 : arrowGoesToRight ? width - CellSize + 10 : CellSize - 10
	);
	const toY = $derived(isSnake ? height - CellSize - 10 : CellSize - 10);
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
		stroke="rgba(0,0,0,0.5)"
		stroke-width="3"
		marker-start={isSnake ? 'url(#red-arrow-start)' : 'url(#green-arrow-start)'}
		marker-end={isSnake ? 'url(#red-arrow-end)' : 'url(#green-arrow-end)'}
	/>
</svg>
