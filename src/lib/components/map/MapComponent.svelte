<script lang="ts">
	import { LastMapPosition, MAP_IMAGE } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { ladders, mapCellsSorted, MapContainerId, snakes } from '$lib/mapUtils'
	import CellNumber from './CellNumber.svelte'
	import MapArrow from './MapArrow.svelte'
	import MapArrowMarkers from './MapArrowMarkers.svelte'
	import MapCharacters from './MapCharacters.svelte'
	import MovementMarkers from './MovementMarkers.svelte'
	import PlayerCharacter from './PlayerCharacter.svelte'

	const { players, movementStore } = getAppManagerContext()

	$effect(() => {
		const mapWidth = 1715
		const diff = mapWidth - window.innerWidth
		if (diff > 0) {
			document
				.getElementById('map-scroll-container')
				?.scrollTo({ left: diff / 2, behavior: 'smooth' })
		}
	})

	function handleClick() {
		movementStore.selectedPlayer.set(null)
	}
</script>

<div class="flex justify-center">
	<div class="overflow-x-auto overflow-y-hidden" id="map-scroll-container">
		<button id={MapContainerId} class="relative h-[2000px] w-[1700px]" onclick={handleClick}>
			<img class="h-[2000] w-[1700px] bg-center bg-no-repeat" src={MAP_IMAGE} alt="map" />
			<MapArrowMarkers />
			{#each ladders as { cellFrom: from, cellTo: to } (`${from}-${to}`)}
				<MapArrow {from} {to} />
			{/each}
			{#each snakes as { cellFrom: from, cellTo: to } (`${from}-${to}`)}
				<MapArrow {from} {to} />
			{/each}
			<CellNumber cellId={0} />
			<CellNumber cellId={LastMapPosition} />
			{#each mapCellsSorted as cell (cell.id)}
				<CellNumber cellId={cell.id} />
			{/each}
			<MovementMarkers />
			{#each $players as player (player.slug)}
				<PlayerCharacter {player} />
			{/each}
			<MapCharacters />
		</button>
	</div>
</div>
