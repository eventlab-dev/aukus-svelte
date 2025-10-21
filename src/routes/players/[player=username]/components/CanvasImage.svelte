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
			konvaImage.node.y(file.y + yOffset)
			konvaImage.node.getLayer()?.batchDraw()
		}
	})

	let attachedMoveCard = $state<HTMLElement | null>(null)
	const yOffset = $derived(attachedMoveCard ? attachedMoveCard.getBoundingClientRect().top : 0)

	$effect(() => {
		if (!attachedMoveCard && file.attach_move_id) {
			const findCard = () => {
				const el = document.getElementById(`move-card-${file.attach_move_id}`)
				if (el) {
					attachedMoveCard = el
					observer.disconnect()
				}
			}
			const observer = new MutationObserver(findCard)
			observer.observe(document.body, { childList: true, subtree: true })
			findCard()
			return () => observer.disconnect()
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
			y: event.target.y() - yOffset
		}
		// console.log('drag update y', event.target.y(), yOffset, event.target.y() - yOffset)
		canvasStore.updateImage(updatedFile)
	}

	function handleTransformEnd() {
		if (!konvaImage) return
		const node = konvaImage.node

		const updatedFile: CanvasFile = {
			...file,
			x: node.x() - centerX,
			y: node.y() - yOffset,
			scale_x: node.scaleX(),
			scale_y: node.scaleY(),
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
	x={centerX + x}
	y={y + yOffset}
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
