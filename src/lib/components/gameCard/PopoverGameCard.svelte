<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import type { CommonGameItem } from '$lib/types'
	import PlayerAvatar from '../player/PlayerAvatar.svelte'
	import GamePopupContent from './GamePopupContent.svelte'

	type Props = {
		game: CommonGameItem
	}

	const { game }: Props = $props()

	const app = getAppManager()
	const { usersStore } = app

	const playerName = $derived(usersStore.usersBySlug.get(game.player_nickname)?.username ?? game.player_nickname)

	const playerIcon = $derived(usersStore.usersBySlug.get(game.player_nickname)?.avatar_link ?? '')
	
	let open = $state(false)

	let closeTimeout: ReturnType<typeof setTimeout> | undefined = undefined

	function handleMouseEnter() {
		clearTimeout(closeTimeout)
		open = true
	}

	function handleMouseLeave() {
		clearTimeout(closeTimeout)
		closeTimeout = setTimeout(() => {
			open = false
		}, 300)
	}
</script>

<Popover {open} onOpenChange={(value) => (open = value)}>
	<PopoverTrigger
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
	>
		{#if playerIcon}
			<PlayerAvatar src={playerIcon} name={playerName} size="small" />
		{:else}
			<div class="bg-secondary px-2 py-1 rounded-lg">
				{playerName}
			</div>
		{/if}
	</PopoverTrigger>
	<PopoverContent
		class="max-w-[500px] w-fit space-y-5"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
	>
		<GamePopupContent {game} />
	</PopoverContent>
</Popover>
