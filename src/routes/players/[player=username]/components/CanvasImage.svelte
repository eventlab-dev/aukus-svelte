<script lang="ts">
	import type { CanvasFile } from '$lib/heyapi/aukus/types.gen'
	import { onMount } from 'svelte'
	import { Image } from 'svelte-konva'

	type Props = {
		file: CanvasFile
		editable: boolean
	}

	const { file, editable }: Props = $props()

	const { x, y, scaleX, scaleY, height, width, rotation, zIndex } = file

	let image = $state<HTMLImageElement | undefined>(undefined)

	onMount(() => {
		const img = document.createElement('img')
		img.src = file.url
		img.onload = () => {
			image = img
		}
	})
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
/>
