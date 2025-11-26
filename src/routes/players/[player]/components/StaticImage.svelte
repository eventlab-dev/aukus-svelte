<script lang="ts">
	import type { CanvasFile } from '$lib/heyapi/aukus/types.gen'

	type Props = {
		file: CanvasFile
		centerX: number
	}

	const { file, centerX }: Props = $props()

	const style = $derived.by(() => {
		const styles = [
			`top: ${file.y}px`,
			`left: ${file.x + centerX}px`,
			`width: ${file.width}px`,
			`height: ${file.height}px`,
			`transform-origin: top left;`,
			`transform: rotate(${file.rotation}deg) scaleX(${file.scale_x}) scaleY(${file.scale_y})`
		]
		return styles.join('; ')
	})
</script>

<img src={file.url} alt="user meme" class="absolute select-none" {style} />
