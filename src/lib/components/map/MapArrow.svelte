<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	type Props = {
		from: number
		to: number
		scale?: number
	}

	let { from, to, scale = 1 }: Props = $props()

	const { mapStore } = getAppManagerContext()

	const cellFromPos = $derived(mapStore.cellPositionById[from])
	const cellToPos = $derived(mapStore.cellPositionById[to])

	const isSnake = $derived(from > to)

	const fromX = $derived(cellFromPos.centerX * scale)
	const fromY = $derived(cellFromPos.centerY * scale)
	const toX = $derived(cellToPos.centerX * scale)
	const toY = $derived(cellToPos.centerY * scale)
</script>

<line
	id="arrow-line-{from}-{to}"
	x1={fromX}
	y1={fromY}
	x2={toX}
	y2={toY}
	stroke="rgba(0,0,0,0.7)"
	stroke-width="2"
	marker-start={isSnake ? 'url(#red-arrow-start)' : 'url(#green-arrow-start)'}
	marker-end={isSnake ? 'url(#red-arrow-end)' : 'url(#green-arrow-end)'}
/>
