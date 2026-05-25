<script lang="ts">
	import { LastMapPosition, LOGO_BG_URL, LOGO_URL, MAP_IMAGE } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { ladders, mapCellsSorted, MapContainerId, snakes } from '$lib/mapUtils'
	import { Fireworks, type FireworksOptions } from '@fireworks-js/svelte'
	import CellNumber from './CellNumber.svelte'
	import MapArrow from './MapArrow.svelte'
	import MapArrowMarkers from './MapArrowMarkers.svelte'
	import MapCharacters from './MapCharacters.svelte'
	import MapCountdowwn from './MapCountdowwn.svelte'
	import MovementMarkers from './MovementMarkers.svelte'
	import PlayerCharacter from './PlayerCharacter.svelte'
	import { MapStore } from '$lib/stores/MapStore.svelte'
	import NewCell from './NewCell.svelte'

	const { players, movementStore, eventFinished, winners, mapStore } = getAppManagerContext()

	// let mapImgWidth = $state(1700) // Fallback default
	// let mapImgHeight = $state(2000) // Fallback default

	let mapScale = $state(1)

	let mapImg = $state<HTMLImageElement | null>(null)
	let viewport: HTMLDivElement | null = null

	function updateScale() {
		if (mapImg) {
			mapScale = mapImg.clientWidth / mapImg.naturalWidth
		}
	}

	// $effect(() => {
	// 	if (mapImg) {
	// 		const diff = mapImg.naturalWidth - window.innerWidth
	// 		if (diff > 0) {
	// 			document
	// 				.getElementById('map-scroll-container')
	// 				?.scrollTo({ left: diff / 2, behavior: 'smooth' })
	// 		}
	// 	}
	// })

	function onResize() {
		updateScale()
	}

	$effect(() => {
		window.addEventListener('resize', onResize)
		return () => {
			window.removeEventListener('resize', onResize)
		}
	})

	function handleImageLoad(e: Event) {
		const img = e.currentTarget as HTMLImageElement
		if (img && img.naturalWidth) {
			onResize()
		}
	}

	function handleClick() {
		movementStore.selectedPlayer.set(null)
	}

	const options: FireworksOptions = {
		opacity: 0.5,
		explosion: 8,
		intensity: 45,
		particles: 105
	}

	let x = $state(0)
	let y = $state(0)
	let zoomScale = $state(1)

	let dragging = $state(false)
	let lastX = $state(0)
	let lastY = $state(0)

	function onMouseDown(e: MouseEvent) {
		dragging = true

		lastX = e.clientX
		lastY = e.clientY
	}

	function onMouseMove(e: MouseEvent) {
		if (!dragging || !viewport || !mapImg) return

		const dx = e.clientX - lastX
		const dy = e.clientY - lastY

		x += dx
		y += dy

		// Constrain to image boundaries
		const scaledWidth = mapImg.naturalWidth * zoomScale * mapScale
		const scaledHeight = mapImg.naturalHeight * zoomScale * mapScale
		const viewportWidth = viewport.clientWidth
		const viewportHeight = viewport.clientHeight

		// Calculate min/max x and y based on zoom level
		const minX = scaledWidth > viewportWidth ? viewportWidth - scaledWidth : 0
		const maxX = 0
		
		const minY = scaledHeight > viewportHeight ? viewportHeight - scaledHeight : 0
		const maxY = 0

		x = Math.max(minX, Math.min(x, maxX))
		y = Math.max(minY, Math.min(y, maxY))

		console.log({ minX, minY, x, y, scaledWidth, viewportWidth })

		lastX = e.clientX
		lastY = e.clientY
	}

	function onMouseUp() {
		dragging = false
	}



	function onWheel(e: WheelEvent) {
		e.preventDefault()

		const mouseX = e.clientX
		const mouseY = e.clientY

		const oldScale = zoomScale

		const factor = e.deltaY < 0 ? 1.1 : 0.9
		zoomScale *= factor

		zoomScale = Math.max(1, Math.min(zoomScale, 5))

		const scaleRatio = zoomScale / oldScale

		x = mouseX - (mouseX - x) * scaleRatio
		y = mouseY - (mouseY - y) * scaleRatio
	}

	$inspect('xy', x, y)
</script>

<!-- <div class="relative mt-[-60px] flex hidden w-full justify-center">
	<img src={LOGO_URL} class="absolute top-[170px] z-8 h-auto w-[300px]" alt="logo" />
	<img
		src={LOGO_BG_URL}
		alt="back"
		class="absolute h-auto max-w-[2000px]"
	/>
	{#if $eventFinished}
		<Fireworks
			autostart
			{options}
			class="fireworks pointer-events-none absolute top-0 left-0 z-9 h-[700px] w-full"
		/>
	{/if}
</div> -->

<div class="viewport relative h-screen w-full overflow-hidden">
	<div
		id={MapContainerId}
		class="map-transform absolute top-0 left-0 origin-top-left"
		onclick={handleClick}
		onwheel={onWheel}
		onmousedown={onMouseDown}
		onmousemove={onMouseMove}
		onmouseup={onMouseUp}
		onkeyup={() => {}}
		onkeydown={() => {}}
		tabindex={0}
		role="button"
		bind:this={viewport}
		style={`
      transform:
        translate(${x}px, ${y}px)
        scale(${zoomScale});
    `}
	>
		<img
			bind:this={mapImg}
			src={MAP_IMAGE}
			alt="map"
			onload={handleImageLoad}
			class="h-auto w-full cursor-grab active:cursor-grabbing select-none"
			draggable="false"
		/>

		{#each Object.keys(mapStore.cellPositions) as cellId (cellId)}
			<NewCell cellId={parseInt(cellId)} />
		{/each}

		<!-- <CellNumber cellId={0} />
			<CellNumber cellId={LastMapPosition} />
			{#each mapCellsSorted as cell (cell.id)}
				<CellNumber cellId={cell.id} />
			{/each}
			<MapArrowMarkers />
			{#each ladders as { cellFrom: from, cellTo: to } (`${from}-${to}`)}
				<MapArrow {from} {to} />
			{/each}
			{#each snakes as { cellFrom: from, cellTo: to } (`${from}-${to}`)}
				<MapArrow {from} {to} />
			{/each} -->

		<!-- <MapCharacters /> -->
		<div
			class="absolute top-0 left-0"
			style="transform: scale({mapScale}); transform-origin: top left;"
		>
			<MovementMarkers />
			{#each $players as player (player.slug)}
				<PlayerCharacter {player} />
			{/each}

			<!-- {#each $winners as player (player.slug)}
				<PlayerCharacter {player} asWinner />
			{/each} -->
		</div>

		<MapCountdowwn />
	</div>
</div>
