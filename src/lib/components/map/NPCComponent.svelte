<script lang="ts">
	import { getCellPosition, type NPC } from '$lib/mapUtils'
	import { fade } from 'svelte/transition'

	type Props = {
		npc: NPC
		message?: string
	}

	const { npc, message }: Props = $props()

	const position = getCellPosition(npc.cellId)

	let container = $state<HTMLDivElement | null>(null)
	let messageElement = $state<HTMLDivElement | null>(null)

	let messageStyle = $state('')

	function handleResize() {
		if (container && messageElement) {
			const containerRect = container.getBoundingClientRect()
			const containerCenter = containerRect.width / 2
			const height = messageElement.offsetHeight
			messageStyle = `left: ${containerCenter}px; top: -${height + 10}px;`
		}
	}

	$effect(() => {
		if (container) {
			const observer = new ResizeObserver(() => {
				handleResize()
			})
			observer.observe(container)
			// Initial measure
			handleResize()
			return () => observer.disconnect()
		}
	})
</script>

<div class="absolute" style="left: {position.x + 10}px; top: {position.y}px;" bind:this={container}>
	<img
		src={npc.imageUrl}
		alt="npc"
		class="h-[130px] w-auto"
		style={npc.mirror ? 'transform: scaleX(-1);' : ''}
	/>
	{#if message}
		<div
			bind:this={messageElement}
			class="speech-bubble absolute w-max max-w-[300px] -translate-x-1/2 rounded-lg bg-black/70 p-4 text-center text-white backdrop-blur-sm"
			style={messageStyle}
			in:fade={{ duration: 500 }}
			out:fade={{ duration: 500 }}
		>
			{message}
		</div>
	{/if}
</div>

<style>
	:global(.speech-bubble) {
		position: absolute;
	}

	:global(.speech-bubble::after) {
		content: '';
		position: absolute;
		bottom: -11px; /* below the box */
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 14px solid transparent;
		border-right: 14px solid transparent;
		border-top: 12px solid rgba(0, 0, 0, 0.7); /* same color as the box */
		backdrop-filter: blur(8px);
	}
</style>
