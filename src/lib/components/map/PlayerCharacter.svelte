<script lang="ts">
	import { PlayerBaseModelUrl } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { getCellPosition, getWinnerPosition, laddersByCell, snakesByCell } from '$lib/mapUtils'
	import type { PlayerData } from '$lib/types'
	import { onMount } from 'svelte'

	type Props = {
		player: PlayerData
	}

	const { player }: Props = $props()

	const {
		players,
		eventDataStore,
		movementStore,
		myPlayer,
		turnState,
		playersCompletedMap,
		frontendState
	} = getAppManagerContext()
	const { skinsById, playersBySlug } = eventDataStore

	let element: HTMLDivElement

	const startWinAnimation = $derived(
		player.slug === $myPlayer?.slug &&
			player.map_position === 102 &&
			$turnState === 'player-win-animation'
	)

	const cellPosition = $derived.by(() => {
		if (startWinAnimation) {
			return getCellPosition(101)
		}
		return getCellPosition(player.map_position)
	})

	$effect(() => {
		if (startWinAnimation && element) {
			const position = $playersCompletedMap.findIndex((p) => p.slug === player.slug) + 1
			movementStore.moveToWinPosition({ playerSlug: player.slug, position }).then(() => {
				frontendState.set('event-completed')
			})
		}
	})

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
		const completedIndex = $playersCompletedMap.findIndex((p) => p.slug === player.slug)
		if (completedIndex !== -1 && !startWinAnimation) {
			const coord = getWinnerPosition(completedIndex + 1)
			return { ...coord, onlyName: false }
		}

		const index = playersOnCell.findIndex((p) => p.slug === player.slug)

		if (player.map_position === 0) {
			return { x: 160 + 90 * index, y: 20, onlyName: false }
		}

		if (playersOnCell.length === 1) {
			return { x: 26, y: 20, onlyName: false }
		}

		if (playersOnCell.length === 2) {
			if (index === 0) {
				return { x: 50, y: 0, onlyName: false }
			}
			return { x: -5, y: 35, onlyName: false }
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

	$effect(() => {
		if (element && $turnState === 'selecting-dice' && player.slug === $myPlayer?.slug) {
			// scroll to element
			element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
		}
	})

	const onCharacterClick = (e: MouseEvent) => {
		movementStore.selectedPlayer.set(player)
		e.stopPropagation()
	}

	onMount(() => {
		movementStore.registerPlayer(player.slug, element)
		// @ts-expect-error - for debugging purposes
		window.movePlayer = async (slug: string, steps: number) => {
			const player = $playersBySlug.get(slug)
			if (!player) {
				console.warn('Player not found', slug)
				return
			}
			const moveTo = player.map_position + steps
			const ladderTo = laddersByCell[moveTo]?.cellTo
			const snakeTo = snakesByCell[moveTo]?.cellTo
			const endCell = await movementStore.moveToCell({
				playerSlug: slug,
				steps,
				moveResponse: {
					move_to: moveTo,
					ladder_to: ladderTo ?? null,
					snake_to: snakeTo ?? null
				}
			})

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
						class="absolute top-[0px] left-1/2 h-[80px] w-auto -translate-x-1/2"
					/>
				{:else if skin.slot === 'body'}
					<img
						src={skin.image_url}
						alt="player-skin"
						class="absolute top-[0px] left-1/2 h-[80px] w-auto -translate-x-1/2"
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
