<script lang="ts">
	import type { CanvasFile } from '$lib/heyapi/aukus/types.gen'

	type Props = {
		file: CanvasFile
		centerX: number
	}

	const { file, centerX }: Props = $props()

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
