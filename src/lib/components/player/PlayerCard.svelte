<script lang="ts">
	import { fly } from 'svelte/transition'
	import Star from '../icons/StarIcon.svelte'
	import { Button } from '../ui/button'
	import PlayerAvatar from './PlayerAvatar.svelte'
	import type { PlayerData } from '$lib/types'

	type Props = {
		player: PlayerData
	}

	const { player }: Props = $props()

	let isHovered = $state(false)
</script>

<Button
	href="/players/{player.slug}"
	class="group hover:bg-unset relative z-10 h-auto w-[260px] overflow-hidden rounded-xl bg-card p-0! text-foreground select-none hover:no-underline"
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
>
	<div
		class="relative flex h-full w-full flex-col gap-[5px] p-2 after:absolute after:top-0 after:left-0 after:z-[-1] after:h-full after:w-full after:bg-gradient-to-r after:to-primary/20 after:opacity-0 after:transition-all after:duration-500 hover:after:opacity-100"
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
			<div class="flex h-fit items-center gap-[2px] text-sm font-semibold text-muted-foreground">
				{Math.round(player.total_score)}
				<Star />
			</div>
		</div>
		<div class="grid w-full font-medium text-muted-foreground">
			{#if isHovered}
				<span class="col-start-1 row-start-1" transition:fly={{ x: -50 }}>На страницу -></span>
			{:else}
				<span class="col-start-1 row-start-1 truncate" transition:fly={{ x: 100 }}>
					{player.current_game || 'Выбирает игру...'}
				</span>
			{/if}
		</div>
	</div>
</Button>
