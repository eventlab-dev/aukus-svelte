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
		centerX: number
	}

	const { file, editable, centerX }: Props = $props()

	const { canvasStore } = getAppManagerContext()
	const { selectedImage, selectImage } = canvasStore

	const { x, y, scale_x: scaleX, scale_y: scaleY, height, width, rotation, z_index: zIndex } = file

	let image = $state<HTMLImageElement | undefined>(undefined)

	let konvaImage = $state<ImageType | null>(null)
	let transformer = $state<TransformerType | null>(null)

	$effect(() => {
		if (transformer && konvaImage) {
			transformer.node.nodes([konvaImage.node])
			transformer.node.getLayer()?.batchDraw()
		}
	})

	$effect(() => {
		if (konvaImage) {
			konvaImage.node.scaleX(file.scale_x)
			konvaImage.node.y(file.y)
			konvaImage.node.getLayer()?.batchDraw()
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
		selectImage(file)
	}

	function handleDragEnd(event: KonvaDragTransformEvent) {
		const updatedFile = {
			...file,
			x: event.target.x() - centerX,
			y: event.target.y()
		}
		canvasStore.updateImage(updatedFile)
	}

	function handleTransformEnd() {
		if (!konvaImage) return
		const node = konvaImage.node

		const transformScaleX = node.scaleX()
		const transformScaleY = node.scaleY()

		const newScaleX = transformScaleX > 0 ? 1 : -1
		const newScaleY = transformScaleY > 0 ? 1 : -1

		node.scaleX(newScaleX)
		node.scaleY(newScaleY)

		const updatedFile: CanvasFile = {
			...file,
			x: node.x() - centerX,
			y: node.y(),
			scale_x: newScaleX,
			scale_y: newScaleY,
			rotation: node.rotation(),
			width: Math.abs(Math.max(20, node.width() * transformScaleX)),
			height: Math.abs(node.height() * transformScaleY)
		}

		canvasStore.updateImage(updatedFile)
	}

	const borderColor = $derived.by(() => {
		if ($selectedImage?.id === file.id) {
			return 'purple'
		}
		if (file.attach_move_id) {
			return '#ef5a68'
		}
		return '#d4ddda'
	})
</script>

<Image
	bind:this={konvaImage}
	{image}
	x={centerX + x}
	y={y}
	{scaleX}
	{scaleY}
	{height}
	{width}
	{rotation}
	{zIndex}
	draggable={editable}
	onclick={handleClick}
	ondragend={handleDragEnd}
	ondragstart={() => selectImage(file)}
	ontransformend={handleTransformEnd}
/>

{#if editable}
	<Transformer
		bind:this={transformer}
		flipEnabled
		borderStroke={borderColor}
		borderStrokeWidth={$selectedImage?.id === file.id ? 6 : 3}
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
