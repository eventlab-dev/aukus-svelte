<script lang="ts">
	import type { PlayerData } from '$lib/types'
	import { getStreamUrl, getStreamPlatform } from '$lib/utils/streamUtils'

	let {
		player,
		isExpanded = false,
		onToggleExpand,
		onTogglePlayer,
		showChat,
		onToggleChat,
		class: className = '',
		isFullHeight = false
	}: {
		player: PlayerData
		isExpanded?: boolean
		onToggleExpand: () => void
		onTogglePlayer?: () => void
		showChat?: boolean
		onToggleChat?: () => void
		class?: string
		isFullHeight?: boolean
	} = $props()

	let isUIVisible = $state(false)
	let hideTimer: ReturnType<typeof setTimeout> | null = null

	const streamUrl = $derived(getStreamUrl(player))
	const platform = $derived(getStreamPlatform(player))

	function startHideTimer() {
		if (hideTimer) {
			clearTimeout(hideTimer)
		}
		hideTimer = setTimeout(() => {
			isUIVisible = false
		}, 1000)
	}

	function handleMouseEnter() {
		isUIVisible = true
		if (hideTimer) {
			clearTimeout(hideTimer)
		}
	}

	function handleMouseLeave() {
		startHideTimer()
	}
</script>

{#if streamUrl}
	<div
		class="stream-player relative overflow-hidden bg-black {isExpanded
			? 'expanded'
			: ''} {isExpanded && isFullHeight ? 'full-height' : ''} {className}"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
		role="button"
		tabindex="0"
	>
		<div
			class="absolute left-2 top-2 z-10 transition-opacity duration-200 {isUIVisible
				? 'opacity-100'
				: 'opacity-0'}"
		>
			<div class="flex flex-col gap-2 rounded-lg bg-black/50 p-2">
				<button
					onclick={onToggleExpand}
					class="rounded border-0 bg-[#8B5CF6] px-2 py-1 text-xs text-white hover:bg-[#8B5CF6]/80"
				>
					{isExpanded ? 'Свернуть' : 'Расширить'}
				</button>
				{#if onTogglePlayer}
					<button
						onclick={onTogglePlayer}
						class="rounded border-0 bg-[#8B5CF6] px-2 py-1 text-xs text-white hover:bg-[#8B5CF6]/80"
					>
						Скрыть
					</button>
				{/if}
			</div>
		</div>

		<div
			class="absolute right-2 top-2 z-10 flex gap-2 transition-opacity duration-200 {isUIVisible
				? 'opacity-100'
				: 'opacity-0'}"
		>
			<div class="flex gap-2 rounded-lg bg-black/50 p-2">
				{#if isExpanded && onToggleChat}
					<button
						onclick={onToggleChat}
						class="rounded border-0 bg-[#8B5CF6] px-2 py-1 text-xs text-white hover:bg-[#8B5CF6]/80"
					>
						{showChat ? 'Скрыть чат' : 'Показать чат'}
					</button>
				{/if}
				<a
					href={player.twitch_stream_link || player.vk_stream_link || player.kick_stream_link}
					target="_blank"
					rel="noopener noreferrer"
					class="cursor-pointer rounded bg-[#8B5CF6] px-2 py-1 text-xs text-white transition-colors hover:bg-[#8B5CF6]/80"
				>
					{platform}
				</a>
			</div>
		</div>

		<div class="h-full w-full overflow-hidden {platform.toLowerCase().replace(' ', '-')}-player">
			<iframe
				src={streamUrl}
				class="block h-full w-full border-0"
				title="Stream for {player.username}"
				allowfullscreen
				allow="autoplay; fullscreen"
				sandbox="allow-modals allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
				scrolling="no"
			></iframe>
		</div>
	</div>
{/if}

