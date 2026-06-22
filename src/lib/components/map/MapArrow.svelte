<script lang="ts">
	import { getAppManager } from "$lib/stores/AppManager.svelte"

	
	type Props = {
		from: number
		to: number
		scale?: number
	}

	let { from, to, scale = 1 }: Props = $props()

	const app = getAppManager()
	const { mapStore } = app

	const cellFromPos = $derived(mapStore.cellPositionById[from])
	const cellToPos = $derived(mapStore.cellPositionById[to])

	const isSnake = $derived(from > to)

	const fromX = $derived(cellFromPos.centerX * scale)
	const fromY = $derived(cellFromPos.centerY * scale)
	const toX = $derived(cellToPos.centerX * scale)
	const toY = $derived(cellToPos.centerY * scale)

	const trim = $derived(45 * scale) // pixels to remove from each end

	const dx = $derived(toX - fromX)
	const dy = $derived(toY - fromY)
	const length = $derived(Math.hypot(dx, dy))

	const ux = $derived(dx / length)
	const uy = $derived(dy / length)

	const x1 = $derived(fromX + ux * trim)
	const y1 = $derived(fromY + uy * trim)

	const x2 = $derived(toX - ux * trim)
	const y2 = $derived(toY - uy * trim)
</script>

<line
	id="arrow-line-{from}-{to}"
	x1={x1}
	y1={y1}
	x2={x2}
	y2={y2}
	stroke="rgba(0,0,0,0.7)"
	stroke-width="2"
	marker-start={isSnake ? 'url(#red-arrow-start)' : 'url(#green-arrow-start)'}
	marker-end={isSnake ? 'url(#red-arrow-end)' : 'url(#green-arrow-end)'}
/>
