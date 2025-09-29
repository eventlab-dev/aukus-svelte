<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { ladders, mapCellsSorted, MapContainerId, snakes } from '$lib/mapUtils'
	import CellNumber from './CellNumber.svelte'
	import MapArrow from './MapArrow.svelte'
	import MapArrowMarkers from './MapArrowMarkers.svelte'
	import PlayerCharacter from './PlayerCharacter.svelte'

	const { players } = getAppManagerContext()

	$effect(() => {
		const mapWidth = 1715
		const diff = mapWidth - window.innerWidth
		if (diff > 0) {
			document
				.getElementById('map-scroll-container')
				?.scrollTo({ left: diff / 2, behavior: 'smooth' })
		}
	})
</script>

<div class="flex justify-center">
	<div class="overflow-x-auto overflow-y-hidden" id="map-scroll-container">
		<div id={MapContainerId} class="relative h-[2000px] w-[1700px]">
			<img class="h-[2000] w-[1700px] bg-center bg-no-repeat" src="map_demo.png" alt="map" />
			<MapArrowMarkers />
			{#each ladders as { cellFrom: from, cellTo: to } (`${from}-${to}`)}
				<MapArrow {from} {to} />
			{/each}
			{#each snakes as { cellFrom: from, cellTo: to } (`${from}-${to}`)}
				<MapArrow {from} {to} />
			{/each}
			{#each mapCellsSorted as cell (cell.id)}
				<CellNumber cellId={cell.id} />
			{/each}
			{#each $players as player (player.slug)}
				<PlayerCharacter {player} />
			{/each}
		</div>
	</div>
</div>
