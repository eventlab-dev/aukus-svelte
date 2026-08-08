<script lang="ts">
	import { LastMapPosition, MAP_IMAGE, MAP_SIDE_IMAGE, WinPosition } from '$lib/constants'
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
	import { untrack } from 'svelte'

	const app = getAppManager()
	const { movementStore, mapStore } = app

	let mapScale = $state(1)
	let hideArrows = $state(false)

	const offsetRight = 0

	let mapImg = $state<HTMLImageElement | null>(null)
	let viewport = $state<HTMLButtonElement | null>(null)

	let imageLoaded = $state(false)
	let userZoom = $state(1)

	let mapImgHeight = $state(0)
	let viewportHeight = $state(0)

	function updateScale() {
		if (mapImg && mapImg.naturalWidth !== 0) {
			mapScale = mapImg.clientWidth / mapImg.naturalWidth
			mapImgHeight = mapImg.clientHeight
			if (viewport) {
				const minZoom = (viewport.clientWidth - offsetRight) / viewport.clientWidth
				userZoom = minZoom
			}
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

	$effect(() => {
		if (!viewport) return

		const observer = new ResizeObserver(() => {
			if (imageLoaded && !positionInitialized) {
				setInitialPos()
			}
		})

		observer.observe(viewport)
		return () => observer.disconnect()
	})

	function handleClick(evt: MouseEvent) {
		console.log('on click', mouseUpAfterDrag)
		if (!mouseUpAfterDrag) {
			movementStore.selectedPlayer = null
		}
		evt.stopPropagation()
	}

	const options: FireworksOptions = {
		opacity: 0.5,
		explosion: 8,
		intensity: 45,
		particles: 105
	}

	let mapX = $state(0)
	let mapY = $state(0)

	let dragging = $state(false)
	let mouseDown = $state(false)
	let mouseX = $state(0)
	let mouseY = $state(0)
	let lastX = $state(0)
	let lastY = $state(0)

	let mouseUpAfterDrag = $state(false)

	let transition = $state('transform 0.25s ease-out')
	let positionInitialized = $state(false)

	function onMouseDown(e: MouseEvent) {
		e.stopPropagation()

		dragging = false
		mouseDown = true

		lastX = e.clientX
		lastY = e.clientY

		transition = 'none'
	}

	function onMouseMove(e: MouseEvent) {
		e.stopPropagation()

		if (!viewport || !mapImg || !mouseDown) return
		if (!dragging) {
			if (Math.hypot(e.clientX - lastX, e.clientY - lastY) < 5) {
				return
			}
			dragging = true
		}

		mouseX = e.clientX - viewport!.getBoundingClientRect().left
		mouseY = e.clientY - viewport!.getBoundingClientRect().top

		const dx = e.clientX - lastX
		const dy = e.clientY - lastY

		mapX += dx
		mapY += dy

		clampPosition()

		lastX = e.clientX
		lastY = e.clientY
	}

	function onMouseUp(evt: MouseEvent) {
		evt.stopPropagation()
		mouseDown = false
		if (dragging) {
			dragging = false
			transition = 'transform 0.25s ease-out'
			mouseUpAfterDrag = true
		} else {
			movementStore.selectedPlayer = null
			mouseUpAfterDrag = false
		}
	}

	function onMouseDownViewport(evt: MouseEvent) {
		mouseUpAfterDrag = false
	}

	function setInitialPos() {
		if (!mapImg) return

		// Use viewport.clientHeight directly if viewportHeight state hasn't updated yet
		const actualViewportHeight = viewport?.clientHeight || viewportHeight
		if (actualViewportHeight === 0) {
			return
		}

		const scaledHeight = mapImg.naturalHeight * userZoom * mapScale

		mapX = 0
		mapY = actualViewportHeight / 2 - scaledHeight / 2

		positionInitialized = true
	}

	$effect(() => {
		if (imageLoaded && viewportHeight > 0) {
			untrack(() => setInitialPos())
		}
	})

	function getBounds() {
		const scaledWidth = mapImg!.naturalWidth * userZoom * mapScale
		const scaledHeight = mapImg!.naturalHeight * userZoom * mapScale

		const viewportWidth = viewport!.clientWidth
		const viewportHeight = viewport!.clientHeight

		// const overscroll = 0.15

		const extensionLeft = 100
		const extensionRight = userZoom === 1.0 ? 100 : 100 + 260
		const extensionTop = 80
		const extensionBottom = 80

		// const overscrollX = viewportWidth * 0.1
		// const overscrollY = viewportHeight * 0.2

		let minX = -extensionRight
		let maxX = extensionLeft
		if (scaledWidth > viewportWidth) {
			minX = viewportWidth - scaledWidth - extensionRight
			maxX = extensionLeft
		}

		let minY = -extensionBottom
		let maxY = viewportHeight - scaledHeight + extensionBottom
		if (scaledHeight > viewportHeight) {
			minY = viewportHeight - scaledHeight - extensionBottom
			maxY = extensionTop
		}

		return {
			minX,
			maxX,
			minY,
			maxY
		}
	}

	const zoomMin = 1
	const zoomMax = 5

	function onWheel(e: WheelEvent) {
		e.preventDefault()

		if (!viewport || !mapImg) return

		const rect = viewport.getBoundingClientRect()

		const mouseX = e.clientX - rect.left
		const mouseY = e.clientY - rect.top

		const oldScale = userZoom

		const factor = e.deltaY < 0 ? 1.1 : 0.9

		userZoom *= factor
		userZoom = Math.max(zoomMin, Math.min(userZoom, zoomMax))

		const scaleRatio = userZoom / oldScale

		mapX = mouseX - (mouseX - mapX) * scaleRatio
		mapY = mouseY - (mouseY - mapY) * scaleRatio

		transition = 'transform 0.15s ease-out'

		clampPosition()
	}

	function clampPosition() {
		if (!viewport || !mapImg) return

		const { minX, maxX, minY, maxY } = getBounds()

		mapX = Math.max(minX, Math.min(maxX, mapX))
		mapY = Math.max(minY, Math.min(maxY, mapY))
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

<button
	class="viewport relative h-screen w-full overflow-visible"
	bind:this={viewport}
	bind:clientHeight={viewportHeight}
	onclick={handleClick}
	onmousedown={onMouseDownViewport}
>
	<div
		id={MapContainerId}
		class="map-transform absolute top-0 left-0 origin-top-left overflow-hidden"

		onwheel={onWheel}
		onmousedown={onMouseDown}
		onmousemove={onMouseMove}
		onmouseup={onMouseUp}
		onkeyup={() => {}}
		onkeydown={() => {}}
		tabindex={0}
		role="button"
		style={`
     	transform: translate(${mapX}px, ${mapY}px) scale(${userZoom});
     	transition: ${transition};
     	opacity: ${positionInitialized ? 1 : 0};
		`}
	>
		<div class="flex w-full">
			<img
				bind:this={mapImg}
				src={MAP_IMAGE}
				onload={() => {
					imageLoaded = true
				}}
				alt="map"
				class="h-full w-full min-w-0 cursor-grab select-none active:cursor-grabbing"
				draggable="false"
			/>
			<div class="w-[260px] shrink-0">
				<img
					src={MAP_SIDE_IMAGE}
					alt="map-side"
					class="cursor-grab select-none active:cursor-grabbing"
					draggable="false"
					style={`
						height: ${mapImgHeight}px;
						width: 260px;
					`}
				/>
			</div>
		</div>

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
					{#if player.map_position !== WinPosition}
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
</button>
