<script lang="ts">
	import { fly } from 'svelte/transition'
	import { Button } from '../ui/button'
	import PlayerAvatar from './PlayerAvatar.svelte'
	import type { PlayerData } from '$lib/types'
	import ShieldIcon from '../icons/new/ShieldIcon.svelte'
	import FireIcon from '../icons/new/FireIcon.svelte'
	import StarIcon from '../icons/new/StarIcon.svelte'
	import { getDirectStreamUrl } from '$lib/utils/streamUtils'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { CDN_URL_BASE5 } from '$lib/constants'

	type Props = {
		player: PlayerData
	}

	const { player }: Props = $props()

	const app = getAppManager()
	const { movementStore, navStore } = app

	let isHovered = $state(false)
	let hoverTimeout: ReturnType<typeof setTimeout> | null = null

	function handleMouseEnter() {
		isHovered = true

		hoverTimeout = setTimeout(() => {
			movementStore.hoveredPlayer = player.slug
		}, 400)
	}

	function handleMouseLeave() {
		isHovered = false

		if (hoverTimeout) {
			clearTimeout(hoverTimeout)
			hoverTimeout = null
		}

		movementStore.hoveredPlayer = null
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

	const cardImgUrl = `${CDN_URL_BASE5}/ui/player-card-bg.png`
</script>

<Button
	onclick={openPlayer}
	class="group hover:bg-unset relative z-10 h-auto w-[260px] overflow-hidden rounded-[18px]! p-0! select-none hover:no-underline scale-100 hover:scale-110 transition-transform duration-300 active:scale-90"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onauxclick={handleAuxClick}
>
	<div
		class="relative flex h-full w-full flex-col gap-[5px] rounded-[18px]! p-2 after:absolute after:top-0 after:left-0 after:z-[-1] after:h-full after:w-full after:bg-gradient-to-r after:to-primary/20 after:opacity-0 after:transition-all after:duration-500 hover:after:opacity-100"
		style="background-image: url('{cardImgUrl}'); background-size: cover;"
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
				<div class="flex h-fit items-center gap-[2px] font-semibold">
					{player.shit_stacks}<FireIcon />
				</div>
				<div class="flex h-fit items-center gap-[2px] font-semibold">
					{player.shield_stacks}<ShieldIcon />
				</div>
				<div class="flex h-fit items-center gap-[2px] text-sm font-semibold ">
					{Math.round(player.total_score)}
					<StarIcon />
				</div>
			</div>
		</div>
		<div class="grid w-full font-medium text-foreground/80">
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
