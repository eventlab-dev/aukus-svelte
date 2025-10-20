<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { CanvasFile } from '$lib/heyapi/aukus/types.gen'
	import { onMount } from 'svelte'
	import {
		Image,
		type KonvaDragTransformEvent,
		Transformer,
		type Transformer as TransformerType,
		type Image as ImageType
	} from 'svelte-konva'

	type Props = {
		file: CanvasFile
		editable: boolean
	}

	const { file, editable }: Props = $props()

	const { canvasStore } = getAppManagerContext()
	const { selectedImage } = canvasStore

	const { x, y, scaleX, scaleY, height, width, rotation, zIndex } = file

	let image = $state<HTMLImageElement | undefined>(undefined)

	let konvaImage = $state<ImageType | null>(null)
	let transformer = $state<TransformerType | null>(null)

	$effect(() => {
		if (transformer && konvaImage) {
			transformer.node.nodes([konvaImage.node])
			transformer.node.getLayer()?.batchDraw()
		}
	})

	onMount(() => {
		const img = document.createElement('img')
		img.src = file.url
		img.onload = () => {
			image = img
		}
	})

	function handleClick() {
		selectedImage.set(file)
	}

	function handleDragEnd(event: KonvaDragTransformEvent) {
		const updatedFile = { ...file, x: event.target.x(), y: event.target.y() }
		canvasStore.updateImage(updatedFile)
	}

	function handleTransformEnd() {
		if (!konvaImage) return
		const node = konvaImage.node

		const updatedFile: CanvasFile = {
			...file,
			x: node.x(),
			y: node.y(),
			scaleX: node.scaleX(),
			scaleY: node.scaleY(),
			rotation: node.rotation(),
			width: node.width(),
			height: node.height()
		}

		canvasStore.updateImage(updatedFile)
	}
</script>

<Image
	bind:this={konvaImage}
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
	ondragstart={() => selectedImage.set(file)}
	ontransformend={handleTransformEnd}
/>

{#if editable}
	<Transformer
		bind:this={transformer}
		flipEnabled
		borderStroke={$selectedImage?.id === file.id ? 'magenta' : undefined}
		borderStrokeWidth={$selectedImage?.id === file.id ? 2 : 1}
		rotationSnaps={[0, 90, 180, 270, 45, -45, 135, 225]}
		rotationSnapTolerance={5}
		anchorCornerRadius={50}
		boundBoxFunc={(_oldBox, newBox) => {
			// limit resize
			if (newBox.width < 5 || newBox.height < 5) {
				return _oldBox
			}
			return newBox
		}}
	/>
{/if}
