<script lang="ts">
	import {
		MapMarkerDungeon,
		MapMarkerFinish,
		MapMarkerFire,
		MapMarkerForest,
		MapMarkerIce,
		MapMarkerStart,
		MapMarkerSwamp
	} from '$lib/constants'
	import { getCellPosition } from '$lib/mapUtils'

	const { cellId } = $props<{ cellId: number }>()

	const { cellPosition, size } = $derived.by(() => {
		const pos = getCellPosition(cellId)
		if (cellId === 0) {
			return { cellPosition: { x: pos.x + 50, y: pos.y + 10 }, size: 2 }
		}
		if (cellId === 101) {
			return { cellPosition: { x: pos.x, y: pos.y }, size: 2 }
		}
		return { cellPosition: pos, size: 1 }
	})

	function getMarkerUrl(cellId: number): string {
		if (cellId === 0) {
			return MapMarkerStart
		}
		if (cellId === 101) {
			return MapMarkerFinish
		}
		if (cellId <= 20) {
			return MapMarkerForest
		}
		if (cellId <= 40) {
			return MapMarkerSwamp
		}
		if (cellId <= 70) {
			return MapMarkerDungeon
		}
		if (cellId <= 90) {
			return MapMarkerFire
		}
		return MapMarkerIce
	}

	const markerUrl = getMarkerUrl(cellId)

	const cellText = $derived.by(() => {
		if (cellId === 0) {
			return ''
		} else if (cellId === 101) {
			return ''
		}
		return cellId.toString()
	})
</script>

<div
	class="absolute flex h-[35px] w-[35px] items-center justify-center text-black"
	style="top: {cellPosition.y + 1}px; left: {cellPosition.x + 3}px; width: {35 *
		size}px; height: {35 * size}px;"
>
	<img src={markerUrl} alt="marker" class="absolute inset-0" />
	<p class="relative">{cellText}</p>
</div>
