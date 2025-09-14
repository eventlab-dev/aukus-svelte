<script lang="ts">
	import { ladders, MapContainerId, snakes } from '$lib/mapUtils';
	import MapArrow from './MapArrow.svelte';
	import MapArrowMarkers from './MapArrowMarkers.svelte';
</script>

<div id={MapContainerId} class="relative">
	<img
		class="z-10"
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
</div>
