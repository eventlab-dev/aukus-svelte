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

	let image = $state<HTMLImageElement | undefined>(undefined)

	let konvaImage = $state<ImageType | null>(null)
	let transformer = $state<TransformerType | null>(null)

	let attachedMoveCard = $state<HTMLElement | null>(null)
	const yOffset = $derived.by(() => {
		if (attachedMoveCard) {
			const scrollElement = document.getElementById('main-scroll-area')?.firstElementChild
			if (scrollElement) {
				return attachedMoveCard.getBoundingClientRect().top + scrollElement.scrollTop
			}
		}
		return 0
	})

	$effect(() => {
		if (transformer && konvaImage) {
			transformer.node.nodes([konvaImage.node])
			transformer.node.getLayer()?.batchDraw()
		}
	})

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
		if (file.attach_move_id === null) {
			attachedMoveCard = null
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
		canvasStore.selectImage(file)
	}

	function handleDragEnd(event: KonvaDragTransformEvent) {
		const updatedFile = {
			...file,
			x: event.target.x() - centerX,
			y: event.target.y() - yOffset
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
			y: node.y() - yOffset,
			scale_x: newScaleX,
			scale_y: newScaleY,
			rotation: node.rotation(),
			width: Math.abs(Math.max(20, node.width() * transformScaleX)),
			height: Math.abs(node.height() * transformScaleY)
		}

		canvasStore.updateImage(updatedFile)
	}

	const borderColor = $derived.by(() => {
		if (canvasStore.selectedImage?.id === file.id) {
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
	x={centerX + file.x}
	y={file.y + yOffset}
	scaleX={file.scale_x}
	scaleY={file.scale_y}
	height={file.height}
	width={file.width}
	rotation={file.rotation}
	zIndex={file.z_index}
	draggable={editable}
	onclick={handleClick}
	ondragend={handleDragEnd}
	ondragstart={() => canvasStore.selectImage(file)}
	ontransformend={handleTransformEnd}
/>

{#if editable}
	<Transformer
		bind:this={transformer}
		flipEnabled
		borderStroke={borderColor}
		borderStrokeWidth={canvasStore.selectedImage?.id === file.id ? 6 : 3}
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
