<script lang="ts">
	import {
		LastMapPosition,
		MapMarkerDungeon,
		MapMarkerFinish,
		MapMarkerFire,
		MapMarkerForest,
		MapMarkerIce,
		MapMarkerStart,
		MapMarkerSwamp
	} from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'


	const { cellId } = $props<{ cellId: number }>()

	const appManager = getAppManagerContext()
	const { mapStore } = appManager

	const { cellPosition, size } = $derived.by(() => {
		const pos = mapStore.cellPositionById[cellId]
		if (cellId === 0) {
			return { cellPosition: { centerX: pos.centerX + 50, centerY: pos.centerY + 10 }, size: 2 }
		}
		if (cellId === LastMapPosition) {
			return { cellPosition: { centerX: pos.centerX, centerY: pos.centerY }, size: 2 }
		}
		return { cellPosition: pos, size: 1 }
	})

	function getMarkerUrl(cellId: number): string {
		if (cellId === 0) {
			return MapMarkerStart
		}
		if (cellId === LastMapPosition) {
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
		} else if (cellId === LastMapPosition) {
			return ''
		}
		return cellId.toString()
	})
</script>

<div
	class="absolute flex h-[35px] w-[35px] items-center justify-center text-black"
	style="top: {cellPosition.centerY + 1}px; left: {cellPosition.centerX + 3}px; width: {35 *
		size}px; height: {35 * size}px;"
>
	<img src={markerUrl} alt="marker" class="absolute inset-0" />
	<p class="relative">{cellText}</p>
</div>