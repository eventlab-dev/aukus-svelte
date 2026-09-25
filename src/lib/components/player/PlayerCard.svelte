<script lang="ts">
	import { fade, fly } from 'svelte/transition'
	import { Button } from '../ui/button'
	import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
	import type { PlayerData } from '$lib/types'
	import { getDirectStreamUrl } from '$lib/utils/streamUtils'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { CARD_BORDER_URL, CARD_FIRE_URL, CARD_SHIELD_URL, CARD_STAR_URL, PLAYER_CARD_BG_URL } from '$lib/constants'

	type Props = {
		player: PlayerData
	}

	const { player }: Props = $props()

	const app = getAppManager()
	const { movementStore, soundManager } = app

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

	const cardImgUrl = PLAYER_CARD_BG_URL
	const cardBorderUrl = CARD_BORDER_URL
	const cardShieldUrl = CARD_SHIELD_URL
	const cardFireUrl = CARD_FIRE_URL
	const cardStarUrl = CARD_STAR_URL

	function playSelectSound() {
		soundManager.playUi('ui-select', { volume: 0.4 })
	}
</script>

<Button
	href={`/${player.slug}`}
	class="group hover:bg-unset relative z-10 h-auto w-[260px] origin-right overflow-visible rounded-[18px]! p-0! transition-transform duration-300 select-none hover:scale-105 hover:no-underline"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onclick={playSelectSound}
	onauxclick={handleAuxClick}
>
	<div
		class="relative flex h-full w-full flex-col gap-0 overflow-hidden rounded-[18px]! p-2 after:absolute after:top-0 after:left-0 after:z-[-1] after:h-full after:w-full after:bg-gradient-to-r after:to-primary/20 after:opacity-0 after:transition-all after:duration-500 hover:after:opacity-100"
		style="background-image: url('{cardImgUrl}'); background-size: cover;"
	>
		<!-- Оба состояния в одной grid-ячейке: при смене контента высота
			плашки не прыгает (69px всегда), иначе ховер трясётся -->
		<div class="grid w-full">
			{#if isHovered}
				<div class="col-start-1 row-start-1" transition:fly={{ y: -8, duration: 250 }}>
					<div class="flex h-8 w-full items-center">
						<div
							class="flex w-full items-center justify-between font-display text-xl font-extrabold text-ice-soft"
						>
							<span class="text-2xl font-extrabold text-ice/80">{'>'}</span>
							<div class="flex items-center">
								{player.shield_stacks}<img
									src={cardShieldUrl}
									alt="shields"
									class="ml-1 size-6"
									draggable="false"
								/>
							</div>
							<div class="flex items-center">
								{player.shit_stacks}<img
									src={cardFireUrl}
									alt="subs"
									class="ml-1 size-6"
									draggable="false"
								/>
							</div>
							<div class="flex items-center">
								{Math.round(player.total_score)}<img
									src={cardStarUrl}
									alt="points"
									class="ml-1 size-6"
									draggable="false"
								/>
							</div>
							<span class="text-2xl font-extrabold text-ice/80">{'<'}</span>
						</div>
					</div>
					<div class="flex h-[21px] w-full items-center overflow-hidden leading-[21px]">
						<Avatar class="size-[21px] shrink-0">
							<AvatarImage src={player.avatar_link ?? ''} />
							<AvatarFallback class="text-[8px] uppercase">
								{player.username.slice(0, 2)}
							</AvatarFallback>
						</Avatar>
						<div
							class="ml-[6px] truncate font-display text-base font-extrabold text-ice/80 italic"
						>
							{player.username}
						</div>
					</div>
				</div>
			{:else}
				<div class="col-start-1 row-start-1" transition:fly={{ y: 8, duration: 250 }}>
					<div class="flex w-full items-center justify-between gap-[5px]">
						<div class="flex min-w-0 items-center">
							<div class="relative w-fit shrink-0">
								<Avatar class="size-8">
									<AvatarImage src={player.avatar_link ?? ''} />
									<AvatarFallback class="text-[10px] uppercase">
										{player.username.slice(0, 2)}
									</AvatarFallback>
								</Avatar>
								{#if player.is_online}
									<span
										class="absolute right-0 bottom-0 size-[14px] rounded-full bg-[#52AD94]"
									></span>
								{/if}
							</div>
							<div class="ml-[6px] truncate font-display text-xl font-extrabold text-ice">
								{player.username}
							</div>
						</div>
						<div class="shrink-0 font-display text-xl font-extrabold italic">
							{Math.round(player.total_score)}
						</div>
					</div>
					<div
						class="grid h-[21px] w-full overflow-hidden text-base leading-[21px] font-extrabold text-ice/80 italic"
					>
						<span class="col-start-1 row-start-1 truncate">
							{player.current_game || 'Выбирает игру...'}
						</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
	{#if isHovered}
		<!-- Обводка из фигмовского экспорта через background-image -->
		<div
			class="pointer-events-none absolute -inset-[2px] z-20"
			style="background-image: url('{cardBorderUrl}'); background-size: 100% 100%; background-repeat: no-repeat;"
			transition:fade={{ duration: 150 }}
		></div>
	{/if}
</Button>
