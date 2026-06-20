<script lang="ts">
	import { fly } from 'svelte/transition'
	import { Button } from '../ui/button'
	import PlayerAvatar from './PlayerAvatar.svelte'
	import type { PlayerData } from '$lib/types'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import ShieldIcon from '../icons/new/ShieldIcon.svelte'
	import FireIcon from '../icons/new/FireIcon.svelte'
	import StarIcon from '../icons/new/StarIcon.svelte'
	import { getDirectStreamUrl } from '$lib/utils/streamUtils'

	type Props = {
		player: PlayerData
	}

	const { player }: Props = $props()
	const { movementStore, navStore } = getAppManagerContext()
	const { hoveredPlayer } = movementStore

	let isHovered = $state(false)
	let hoverTimeout: ReturnType<typeof setTimeout> | null = null

	function handleMouseEnter() {
		isHovered = true

		hoverTimeout = setTimeout(() => {
			hoveredPlayer.set(player.slug)
		}, 400)
	}

	function handleMouseLeave() {
		isHovered = false

		if (hoverTimeout) {
			clearTimeout(hoverTimeout)
			hoverTimeout = null
		}

		hoveredPlayer.set(null)
	}

	function handleAuxClick(event: MouseEvent) {
		if (event.button === 1) {
			event.preventDefault()
			const streamUrl = getDirectStreamUrl(player)
			if (streamUrl) {
				window.open(streamUrl, '_blank')
			}
		}
	}

	function openPlayer() {
		navStore.changeDynamicPage(player.slug)
	}
</script>

<Button
	onclick={openPlayer}
	class="group hover:bg-unset relative z-10 h-auto w-[260px] overflow-hidden rounded-[18px]! p-0! select-none hover:no-underline bg-card-blue! text-card-blue-foreground"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onauxclick={handleAuxClick}
>
	<div
		class="relative flex h-full w-full flex-col gap-[5px] rounded-[18px]! p-2 after:absolute after:top-0 after:left-0 after:z-[-1] after:h-full after:w-full after:bg-gradient-to-r after:to-primary/20 after:opacity-0 after:transition-all after:duration-500 hover:after:opacity-100"
	>
		<div class="flex w-full justify-between gap-[5px]">
			<div class="flex items-center gap-2">
				<PlayerAvatar
					src={player.avatar_link ?? ''}
					name={player.username}
					isOnline={Boolean(player.is_online)}
				/>
				<div class="font-bold">{player.username}</div>
			</div>
			<div class="flex gap-[8px]">
				<div class="flex h-fit items-center gap-[2px] font-semibold text-card-blue-foreground">
					{player.shit_stacks}<FireIcon />
				</div>
				<div class="flex h-fit items-center gap-[2px] font-semibold text-card-blue-foreground">
					{player.shield_stacks}<ShieldIcon />
				</div>
				<div class="flex h-fit items-center gap-[2px] text-sm font-semibold text-card-blue-foreground">
					{Math.round(player.total_score)}
					<StarIcon />
				</div>
			</div>
		</div>
		<div class="grid w-full font-medium text-card-blue-foreground/80">
			{#if isHovered}
				<span class="col-start-1 row-start-1" transition:fly={{ x: -50 }}>Открыть</span>
			{:else}
				<span class="col-start-1 row-start-1 truncate" transition:fly={{ x: 100 }}>
					{player.current_game || 'Выбирает игру...'}
				</span>
			{/if}
		</div>
	</div>
</Button>
