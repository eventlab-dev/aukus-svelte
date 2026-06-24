<script lang="ts">
	import { LastMapPosition, LOGO_BG_URL, LOGO_URL, MAP_IMAGE } from '$lib/constants'
	import { ladders, mapCellsSorted, MapContainerId, snakes } from '$lib/mapUtils'
	import { Fireworks, type FireworksOptions } from '@fireworks-js/svelte'
	import CellNumber from './CellNumber.svelte'
	import MapArrow from './MapArrow.svelte'
	import MapArrowMarkers from './MapArrowMarkers.svelte'
	import MapCountdown from './MapCountdown.svelte'
	import MovementMarkers from './MovementMarkers.svelte'
	import PlayerCharacter from './PlayerCharacter.svelte'
	import NewCell from './NewCell.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
	const { movementStore, mapStore } = app

	let mapScale = $state(1)
	let hideArrows = $state(false)

	let mapImg = $state<HTMLImageElement | null>(null)
	let viewport = $state<HTMLDivElement | null>(null)

	let imageLoaded = $state(false)

	function updateScale() {
		if (mapImg) {
			mapScale = mapImg.clientWidth / mapImg.naturalWidth
		}
	}

	$effect(() => {
		if (!mapImg) return

		const observer = new ResizeObserver(() => {
			updateScale()
		})

		observer.observe(mapImg)

		return () => observer.disconnect()
	})

	function handleClick() {
		movementStore.selectedPlayer = null
	}

	const options: FireworksOptions = {
		opacity: 0.5,
		explosion: 8,
		intensity: 45,
		particles: 105
	}

	let x = $state(0)
	let y = $state(0)
	let userZoom = $state(1)

	let dragging = $state(false)
	let lastX = $state(0)
	let lastY = $state(0)

	function onMouseDown(e: MouseEvent) {
		dragging = true

		lastX = e.clientX
		lastY = e.clientY
	}

	let mouseX = $state(0)
	let mouseY = $state(0)

	function getBounds() {
		const scaledWidth = mapImg!.naturalWidth * userZoom * mapScale
		const scaledHeight = mapImg!.naturalHeight * userZoom * mapScale

		const viewportWidth = viewport!.clientWidth
		const viewportHeight = viewport!.clientHeight

		// const overscroll = 0.15

		const overscrollX = viewportWidth * 0.1
		const overscrollY = viewportHeight * 0.2

		return {
			minX: scaledWidth > viewportWidth ? viewportWidth - scaledWidth - overscrollX : -overscrollX,
			maxX: overscrollX,
			minY:
				scaledHeight > viewportHeight ? viewportHeight - scaledHeight - overscrollY : -overscrollY,
			maxY: overscrollY
		}
	}

	function onMouseMove(e: MouseEvent) {
		mouseX = e.clientX - viewport!.getBoundingClientRect().left
		mouseY = e.clientY - viewport!.getBoundingClientRect().top
		if (!dragging || !viewport || !mapImg) return

		const dx = e.clientX - lastX
		const dy = e.clientY - lastY

		x += dx
		y += dy

		clampPosition()

		lastX = e.clientX
		lastY = e.clientY
	}

	function onMouseUp() {
		dragging = false
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault()

		if (!viewport || !mapImg) return

		const rect = viewport.getBoundingClientRect()

		const mouseX = e.clientX - rect.left
		const mouseY = e.clientY - rect.top

		const oldScale = userZoom

		const factor = e.deltaY < 0 ? 1.1 : 0.9

		userZoom *= factor
		userZoom = Math.max(0.8, Math.min(userZoom, 5))

		const scaleRatio = userZoom / oldScale

		x = mouseX - (mouseX - x) * scaleRatio
		y = mouseY - (mouseY - y) * scaleRatio

		clampPosition()
	}

	function clampPosition() {
		if (!viewport || !mapImg) return

		const { minX, maxX, minY, maxY } = getBounds()

		x = Math.max(minX, Math.min(maxX, x))
		y = Math.max(minY, Math.min(maxY, y))
	}
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
	{/if}29
init arrow 70 270 510 210
</div> -->

<div class="viewport relative h-screen w-full overflow-visible" bind:this={viewport}>
	<div
		id={MapContainerId}
		class="map-transform absolute top-0 left-0 origin-top-left overflow-hidden"
		onclick={handleClick}
		onwheel={onWheel}
		onmousedown={onMouseDown}
		onmousemove={onMouseMove}
		onmouseup={onMouseUp}
		onkeyup={() => {}}
		onkeydown={() => {}}
		tabindex={0}
		role="button"
		style={`
      	transform: translate(${x}px, ${y}px) scale(${userZoom});
		`}
	>
		<img
			bind:this={mapImg}
			src={MAP_IMAGE}
			onload={() => {
				imageLoaded = true
			}}
			alt="map"
			class="h-full w-auto cursor-grab select-none active:cursor-grabbing"
			draggable="false"
		/>

		{#if imageLoaded}
			<div class="absolute right-2 bottom-2 z-20 text-black">
				{Math.round(mouseX / mapScale)}:{Math.round(mouseY / mapScale)}
			</div>
			{#each Object.keys(mapStore.cellPositionById) as cellId (cellId)}
				<NewCell cellId={parseInt(cellId)} scale={mapScale} />
			{/each}

			<MapArrowMarkers />
			<svg
				id="arrows-container"
				class="pointer-events-none absolute top-0 left-0 h-full w-full {hideArrows ? 'hidden' : ''}"
			>
				{#each ladders as { cellFrom: from, cellTo: to } (`${from}-${to}`)}
					<MapArrow {from} {to} scale={mapScale} />
				{/each}
				{#each snakes as { cellFrom: from, cellTo: to } (`${from}-${to}`)}
					<MapArrow {from} {to} scale={mapScale} />
				{/each}
			</svg>

			<!-- <MapCharacters /> -->
			<div
				class="absolute top-0 left-0"
				style="transform: scale({mapScale}); transform-origin: top left;"
			>
				<MovementMarkers />
				{#each app.players as player (player.slug)}
					{#if player.map_position !== 102}
						<PlayerCharacter {player} />
					{/if}
				{/each}

				{#each app.winners as player (player.slug)}
					<PlayerCharacter {player} asWinner />
				{/each}
			</div>

			<MapCountdown />
		{/if}
	</div>
</div>
