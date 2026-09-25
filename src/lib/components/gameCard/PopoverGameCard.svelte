<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import type { CommonGameItem } from '$lib/types'
	import { useHoverOpen } from '$lib/utils/hoverOpen.svelte'
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
	
	const hover = useHoverOpen(150, (value) => onHoverChange?.(value))
</script>

<Popover open={hover.open} onOpenChange={(value) => hover.setOpen(value)}>
	<PopoverTrigger
		onmouseenter={hover.handleEnter}
		onmouseleave={hover.handleLeave}
	>
		{#if playerIcon}
			<span
				class="relative block h-[26px] w-[26px] overflow-hidden rounded-full ring-2 ring-ice-border transition-transform duration-200 {hover.open
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
		onmouseenter={hover.handleEnter}
		onmouseleave={hover.handleLeave}
	>
		<GamePopupContent {game} {playerName} {playerIcon} />
	</PopoverContent>
</Popover>
