<script lang="ts">
	import { ladders, mapCellsSorted, MapContainerId, snakes } from '$lib/mapUtils';
	import CellNumber from './CellNumber.svelte';
	import MapArrow from './MapArrow.svelte';
	import MapArrowMarkers from './MapArrowMarkers.svelte';

	$effect(() => {
		const mapWidth = 1715;
		const diff = mapWidth - window.innerWidth;
		if (diff > 0) {
			document
				.getElementById('map-scroll-container')
				?.scrollTo({ left: diff / 2, behavior: 'smooth' });
		}
	});
</script>

<div class="flex justify-center">
	<div class="overflow-x-auto" id="map-scroll-container">
		<div id={MapContainerId} class="relative h-[2146px] w-[1715px]">
			<img
				class="h-[2146px] w-[1715px] bg-center bg-no-repeat"
				src="https://storage.yandexcloud.net/aukus-2024-prod/aukus_map_compressed.png"
				alt="map"
			/>
			<MapArrowMarkers />
			{#each ladders as { cellFrom: from, cellTo: to } (`${from}-${to}`)}
				<!-- Using index as key because there can be multiple identical ladders -->
				<MapArrow {from} {to} />
			{/each}
			{#each snakes as { cellFrom: from, cellTo: to } (`${from}-${to}`)}
				<!-- Using index as key because there can be multiple identical snakes -->
				<MapArrow {from} {to} />
			{/each}
			{#each mapCellsSorted as cell (cell.id)}
				<CellNumber cellId={cell.id} />
			{/each}
		</div>
	</div>
</div>
