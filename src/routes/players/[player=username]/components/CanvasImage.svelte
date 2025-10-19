<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { CanvasFile } from '$lib/heyapi/aukus/types.gen'
	import { onMount } from 'svelte'
	import { Image, type KonvaDragTransformEvent } from 'svelte-konva'

	type Props = {
		file: CanvasFile
		editable: boolean
	}

	const { file, editable }: Props = $props()

	const { canvasStore } = getAppManagerContext()

	const { x, y, scaleX, scaleY, height, width, rotation, zIndex } = file

	let image = $state<HTMLImageElement | undefined>(undefined)

	onMount(() => {
		const img = document.createElement('img')
		img.src = file.url
		img.onload = () => {
			image = img
		}
	})

	function handleClick() {
		canvasStore.selectedImage.set(file)
	}

	function handleDragEnd(event: KonvaDragTransformEvent) {
		const updatedFile = { ...file, x: event.target.x(), y: event.target.y() }
		canvasStore.updateImage(updatedFile)
	}
</script>

<Image
	{image}
	{x}
	{y}
	{scaleX}
	{scaleY}
	{height}
	{width}
	{rotation}
	{zIndex}
	draggable={editable}
	onclick={handleClick}
	ondragend={handleDragEnd}
/>
