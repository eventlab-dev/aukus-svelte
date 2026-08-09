<script lang="ts">
	import { PlayerBaseModelUrl } from '$lib/constants'
	import type { SkinItem } from '$lib/heyapi/aukus/types.gen'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import type { PlayerData } from '$lib/types'
	import PlayerAvatar from '../player/PlayerAvatar.svelte'

	type Props = {
		player: PlayerData
		showUsername?: boolean
		selectedSkins?: SkinItem[]
		variant: 'small' | 'big' | "huge"
	}

	const { player, showUsername, selectedSkins, variant }: Props = $props()

	const app = getAppManager()
	const { eventDataStore } = app

	const sizeStyle = $derived.by(() => {
		switch (variant) {
			case 'small':
				return 'height: 80px;'
			case 'big':
				return 'height: 150px;'
			case "huge":
				return 'height: 400px;'
			default: {
				const _exhaustiveCheck: never = variant
				return _exhaustiveCheck
			}
		}
	})

	const modelStyle = $derived(
		`background-color: ${player.color}; --mask-url: url(${PlayerBaseModelUrl})`
	)

	const skins = $derived.by(() => {
		if (selectedSkins) {
			return selectedSkins
		}
		return player.equipped_skins.map((id) => eventDataStore.skinsById.get(id)).filter((s) => s !== undefined)
	})
</script>

<div class="relative">
	<!-- <img
		src={PlayerBaseModelUrl}
		alt="player-model"
		class="player-shadow h-[80px] w-auto"
		style={sizeStyle}
	/> -->
	<div class="player-shadow">
		<div
			class="player-model data-[variant=big]:h-[150px] data-[variant=big]:w-[137px] data-[variant=small]:h-[80px] data-[variant=small]:w-[73px] data-[variant=huge]:h-[400px] data-[variant=huge]:w-[365px]"
			data-variant={variant}
			style={modelStyle}
		></div>
	</div>
	{#each skins as skin (skin.id)}
		{#if skin.slot === 'head'}
			<img
				src={skin.image_url}
				alt="player-skin"
				class="absolute top-[0px] left-1/2 z-25 h-[80px] w-auto -translate-x-1/2"
				style={sizeStyle}
			/>
		{:else if skin.slot === 'item'}
			<img
				src={skin.image_url}
				alt="player-skin"
				class="absolute top-0 z-25 h-[80px]"
				style={sizeStyle}
			/>
		{:else if skin.slot === 'body'}
			<img
				src={skin.image_url}
				alt="player-skin"
				class="absolute top-[0px] left-1/2 z-20 h-[80px] w-auto -translate-x-1/2"
				style={sizeStyle}
			/>
		{/if}
	{/each}
	{#if showUsername}
		<div class="relative flex h-[10px] w-full justify-center">
			<div class="absolute top-[-8px] z-50 rounded-md bg-card p-1 text-2xl flex gap-2 items-center">
				<PlayerAvatar src={player.avatar_link || ''} name={player.username} size="small" />
				{player.username}
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.player-model) {
		-webkit-mask: var(--mask-url) no-repeat center / contain;
		mask: var(--mask-url) no-repeat center / contain;
		position: relative;
	}

	:global(.player-shadow) {
		filter: drop-shadow(0px 0px 10px rgba(0, 0, 0, 1));
		display: inline-block;
	}
</style>
