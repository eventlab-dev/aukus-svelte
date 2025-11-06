<script lang="ts">
	import { PlayerBaseModelUrl } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { SkinItem } from '$lib/heyapi/aukus/types.gen'
	import type { PlayerData } from '$lib/types'

	type Props = {
		player: PlayerData
		showUsername?: boolean
		selectedSkins?: SkinItem[]
		variant: 'small' | 'big'
	}

	const { player, showUsername, selectedSkins, variant }: Props = $props()

	const { eventDataStore } = getAppManagerContext()
	const { skinsById } = eventDataStore

	const sizeStyle = $derived.by(() => {
		switch (variant) {
			case 'small':
				return 'height: 80px;'
			case 'big':
				return 'height: 150px;'
			default: {
				const _exhaustiveCheck: never = variant
				return _exhaustiveCheck
			}
		}
	})

	const skins = $derived.by(() => {
		if (selectedSkins) {
			return selectedSkins
		}
		return player.equipped_skins.map((id) => $skinsById.get(id)).filter((s) => s !== undefined)
	})
</script>

<div class="relative">
	<img
		src={PlayerBaseModelUrl}
		alt="player-model"
		class="player-shadow h-[80px] w-auto"
		style={sizeStyle}
	/>
	{#each skins as skin (skin.id)}
		{#if skin.slot === 'head'}
			<img
				src={skin.image_url}
				alt="player-skin"
				class="absolute top-[0px] left-1/2 z-25 h-[80px] w-auto -translate-x-1/2"
				style={sizeStyle}
			/>
		{:else if skin.slot === 'body'}
			<img
				src={skin.image_url}
				alt="player-skin"
				class="absolute top-[0px] left-1/2 z-20 h-[80px] w-auto -translate-x-1/2"
				style={sizeStyle}
			/>
		{:else if skin.slot === 'item'}
			<img
				src={skin.image_url}
				alt="player-skin"
				class="absolute top-0 h-[80px]"
				style={sizeStyle}
			/>
		{/if}
	{/each}
	{#if showUsername}
		<div class="relative flex h-[10px] w-full justify-center">
			<p class="absolute top-[-20px] z-50">{player.username}</p>
		</div>
	{/if}
</div>
