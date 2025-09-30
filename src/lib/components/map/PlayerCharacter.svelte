<script lang="ts">
	import { PlayerBaseModelUrl } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { getCellPosition } from '$lib/mapUtils'
	import type { PlayerData } from '$lib/types'
	import { onMount } from 'svelte'

	type Props = {
		player: PlayerData
	}

	const { player }: Props = $props()

	const { players, eventDataStore, movementStore } = getAppManagerContext()
	const { skinsById } = eventDataStore

	const cellPosition = $derived(getCellPosition(player.map_position))

	const otherPlayersOnCell = $derived(
		$players
			.filter((p) => p.map_position === player.map_position && p.slug !== player.slug)
			.sort((a, b) => a.slug.localeCompare(b.slug))
	)

	const cellOffset = $derived.by(() => {
		if (otherPlayersOnCell.length === 0) {
			return { x: 28, y: 20 }
		}

		const index = otherPlayersOnCell.findIndex((p) => p.slug === player.slug)
		if (otherPlayersOnCell.length === 1) {
			if (index === 0) {
				return { x: 0, y: 0 }
			}
			return { x: 28, y: 20 }
		}

		const offsetAmount = 15
		return {
			x: index * offsetAmount,
			y: index * offsetAmount
		}
	})

	const finalTop = $derived(cellPosition.y + cellOffset.y)
	const finalLeft = $derived(cellPosition.x + cellOffset.x)

	const skins = $derived.by(() => {
		return player.equipped_skins.map((id) => $skinsById.get(id)).filter((s) => s !== undefined)
	})

	let element: HTMLDivElement

	const onCharacterClick = () => {
		console.log('Character clicked:', player.username)
		// Here you can add logic to open a profile modal or display more info
	}

	onMount(() => {
		movementStore.registerPlayer(player.slug, element)
	})
</script>

<div bind:this={element} class="absolute" style="top: {finalTop}px; left: {finalLeft}px">
	<button
		onclick={onCharacterClick}
		class="relative cursor-pointer rounded-full p-1
         transition hover:bg-yellow-200/40"
	>
		<img src={PlayerBaseModelUrl} alt="player-model" class="pointer-events-none h-20 w-auto" />
	</button>
	<div
		class="pointer-events-none flex w-full justify-center
"
	>
		<p class="relative top-[-18px] left-0">{player.username}</p>
	</div>
	{#each skins as skin (skin.id)}
		{#if skin.slot === 'head'}
			<img
				src={skin.image_url}
				alt="player-skin"
				class="pointer-events-none absolute top-[-2px] left-1/2 h-[45px] -translate-x-1/2
"
			/>
		{:else if skin.slot === 'body'}
			<img
				src={skin.image_url}
				alt="player-skin"
				class="pointer-events-none absolute top-[12px] left-1/2 w-[80px] max-w-none -translate-x-1/2
"
			/>
		{:else if skin.slot === 'side'}
			<img
				src={skin.image_url}
				alt="player-skin"
				class="pointer-events-none absolute top-0 h-[40px]
"
			/>
		{/if}
	{/each}
</div>
