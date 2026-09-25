<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import type { CommonGameItem } from '$lib/types'
	import GamePopupContent from './GamePopupContent.svelte'

	type Props = {
		game: CommonGameItem
		onHoverChange?: (hovered: boolean) => void
	}

	const { game, onHoverChange }: Props = $props()

	const app = getAppManager()
	const { usersStore } = app

	const playerName = $derived(usersStore.usersBySlug.get(game.player_nickname)?.username ?? game.player_nickname)

	const playerIcon = $derived(usersStore.usersBySlug.get(game.player_nickname)?.avatar_link ?? '')
	
	let open = $state(false)

	let closeTimeout: ReturnType<typeof setTimeout> | undefined = undefined

	function handleMouseEnter() {
		clearTimeout(closeTimeout)
		open = true
		onHoverChange?.(true)
	}

	function handleMouseLeave() {
		clearTimeout(closeTimeout)
		closeTimeout = setTimeout(() => {
			open = false
			onHoverChange?.(false)
		}, 150)
	}
</script>

<Popover {open} onOpenChange={(value) => (open = value)}>
	<PopoverTrigger
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
	>
		{#if playerIcon}
			<span
				class="relative block h-[26px] w-[26px] overflow-hidden rounded-full ring-2 ring-ice-border transition-transform duration-200 {open
					? 'scale-[1.31]'
					: 'scale-100'}"
			>
				<img
					src={playerIcon}
					alt={playerName}
					class="h-full w-full object-cover"
					draggable="false"
				/>
			</span>
		{:else}
			<div class="bg-secondary px-2 py-1 rounded-lg">
				{playerName}
			</div>
		{/if}
	</PopoverTrigger>
	<PopoverContent
		class="popup-box w-[340px] max-w-[calc(100vw-2rem)]"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
	>
		<GamePopupContent {game} {playerName} {playerIcon} />
	</PopoverContent>
</Popover>
