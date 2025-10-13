<script lang="ts">
	import {
		MapDungeonMarker,
		MapFireMarker,
		MapForestMarker,
		MapIceMarker,
		MapSwampMarker
	} from '$lib/constants'
	import { getCellPosition } from '$lib/mapUtils'

	const { cellId } = $props<{ cellId: number }>()

	const cellPosition = getCellPosition(cellId)

	function getMarkerUrl(cellId: number): string {
		if (cellId <= 20) {
			return MapForestMarker
		}
		if (cellId <= 40) {
			return MapSwampMarker
		}
		if (cellId <= 70) {
			return MapDungeonMarker
		}
		if (cellId <= 90) {
			return MapFireMarker
		}
		return MapIceMarker
	}

	const markerUrl = getMarkerUrl(cellId)

	const cellText = $derived.by(() => {
		if (cellId === 0) {
			return 'Старт'
		} else if (cellId === 101) {
			return 'Рывок'
		}
		return cellId.toString()
	})
</script>

<div
	class="absolute flex h-[35px] w-[35px] items-center justify-center text-black"
	style="top: {cellPosition.y + 1}px; left: {cellPosition.x + 3}px"
>
	<img src={markerUrl} alt="marker" class="absolute inset-0" />
	<p class="relative">{cellText}</p>
</div>
