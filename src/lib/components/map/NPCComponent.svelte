<script lang="ts">
	import { getCellPosition, type NPC } from '$lib/mapUtils'
	import { fade } from 'svelte/transition'
	import { parseMessageWithEmotes, type MessagePart } from '$lib/utils/emoteParser'

	type Props = {
		npc: NPC
		message?: string
	}

	const { npc, message }: Props = $props()

	const messageParts = $derived(message ? parseMessageWithEmotes(message) : [])

	type EmoteGroup = 
		| { type: 'text'; content: string }
		| { type: 'emote-group'; base: { name: string; url: string }; overlays: Array<{ name: string; url: string }> }

	/**
	 * Groups emotes with their overlay (zero-width) emotes
	 * Zero-width emotes are added to the previous emote's container
	 */
	function groupEmotesWithOverlays(parts: MessagePart[]): EmoteGroup[] {
		const groups: EmoteGroup[] = []

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i]

			if (part.type === 'text') {
				groups.push({ type: 'text', content: part.content })
			} else if (part.type === 'emote') {
				if (part.isZeroWidth) {
					// Zero-width emote should be added to the previous emote group
					const lastGroup = groups[groups.length - 1]
					if (lastGroup && lastGroup.type === 'emote-group') {
						// Add to previous emote's overlays
						lastGroup.overlays.push({ name: part.name, url: part.url })
					}
					// If there's no previous emote group, skip this overlay (shouldn't happen normally)
				} else {
					// Regular emote - create a new group
					groups.push({
						type: 'emote-group',
						base: { name: part.name, url: part.url },
						overlays: []
					})
				}
			}
		}

		return groups
	}

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
			<div class="inline-flex flex-wrap items-center justify-center gap-1">
				{#each groupEmotesWithOverlays(messageParts) as group}
					{#if group.type === 'text'}
						<span>{group.content}</span>
					{:else if group.type === 'emote-group'}
						<!-- Emote group: base emote + optional overlay emotes -->
						<span class="emote-container">
							<!-- Base emote -->
							<img 
								src={group.base.url} 
								alt={group.base.name} 
								class="emote-image"
								title={group.base.name}
							/>
							<!-- Overlay (zero-width) emotes -->
							{#each group.overlays as overlay}
								<img 
									src={overlay.url} 
									alt={overlay.name} 
									class="emote-image emote-overlay"
									title={overlay.name}
									onload={(e) => {
										e.currentTarget.classList.add('emote-overlay-loaded')
									}}
									onerror={(e) => {
										e.currentTarget.classList.remove('emote-overlay')
									}}
								/>
							{/each}
						</span>
					{/if}
				{/each}
			</div>
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

	/* 
	 * Container for emotes with overlay support
	 * Uses CSS Grid to stack emotes on top of each other
	 */
	:global(.emote-container) {
		display: inline-grid;
		place-items: center;
		vertical-align: middle;
		z-index: 0;
	}

	/* All emotes in the container occupy the same grid cell = overlay effect */
	:global(.emote-container > .emote-image) {
		grid-area: 1 / 1;
		height: 1.5rem; /* 24px, h-6 */
		width: auto;
		vertical-align: middle;
	}

	/* Zero-width overlay emotes start invisible and fade in */
	:global(.emote-overlay) {
		opacity: 0;
		transition: opacity 0.2s ease-in-out;
		pointer-events: none;
	}

	/* Show overlay after image loads (handled by onload event) */
	:global(.emote-overlay-loaded) {
		opacity: 1;
	}
</style>
