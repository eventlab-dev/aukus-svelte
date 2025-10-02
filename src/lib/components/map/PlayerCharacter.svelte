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
	const { skinsById, playersBySlug } = eventDataStore

	const cellPosition = $derived(getCellPosition(player.map_position))

	const playersOnCell = $derived(
		$players
			.filter((p) => p.map_position === player.map_position)
			.sort((a, b) => a.slug.localeCompare(b.slug))
	)

	const {
		x: cellOffsetX,
		y: cellOffsetY,
		onlyName
	} = $derived.by(() => {
		if (playersOnCell.length === 1) {
			return { x: 26, y: 20, onlyName: false }
		}

		const index = playersOnCell.findIndex((p) => p.slug === player.slug)
		if (playersOnCell.length === 2) {
			if (index === 0) {
				return { x: 50, y: 0, onlyName: false }
			}
			return { x: -5, y: 35, onlyName: false }
		}

		if (player.map_position === 0) {
			return { x: 160 + 90 * index, y: 20, onlyName: false }
		}

		return {
			x: 20,
			y: 20 + index * 30,
			onlyName: true
		}
	})

	const finalTop = $derived(cellPosition.y + cellOffsetY)
	const finalLeft = $derived(cellPosition.x + cellOffsetX)

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
		// @ts-expect-error - for debugging purposes
		window.movePlayer = (slug: string, steps: number) => {
			const endCell = movementStore.movePlayer({ playerSlug: slug, steps })
			const player = $playersBySlug.get(slug)
			if (player && endCell !== undefined) {
				console.log('Moving player', slug, 'to cell', endCell)
				player.map_position = endCell
			}
		}
	})
</script>

<div bind:this={element} class="absolute" style="top: {finalTop}px; left: {finalLeft}px">
	<button
		onclick={onCharacterClick}
		class="relative cursor-pointer rounded-full
         transition hover:bg-yellow-200/40"
	>
		{#if onlyName}
			<div class="flex w-full justify-center p-1">
				<p class="relative left-1/2 -translate-x-1/2">{player.username}</p>
			</div>
		{:else}
			<img src={PlayerBaseModelUrl} alt="player-model" class="h-[80px] w-auto" />
			{#each skins as skin (skin.id)}
				{#if skin.slot === 'head'}
					<img
						src={skin.image_url}
						alt="player-skin"
						class="absolute top-[0px] left-1/2 h-[80px] w-auto -translate-x-1/2
"
					/>
				{:else if skin.slot === 'body'}
					<img
						src={skin.image_url}
						alt="player-skin"
						class="absolute top-[0px] left-1/2 h-[80px] w-auto -translate-x-1/2
"
					/>
				{:else if skin.slot === 'side'}
					<img src={skin.image_url} alt="player-skin" class="absolute top-0 h-[40px]" />
				{/if}
			{/each}
			<div class="relative flex h-[10px] w-full justify-center">
				<p class="absolute top-[-20px]">{player.username}</p>
			</div>
		{/if}
	</button>
</div>
