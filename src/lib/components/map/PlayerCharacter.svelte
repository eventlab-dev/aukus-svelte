<script lang="ts">
	import { LastMapPosition } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { getCellPosition, getWinnerPosition, laddersByCell, snakesByCell } from '$lib/mapUtils'
	import type { PlayerData } from '$lib/types'
	import { onMount } from 'svelte'
	import PlayerModel from './PlayerModel.svelte'

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
	const { playersBySlug } = eventDataStore
	const { selectedPlayer, hoveredPlayer } = movementStore

	let element: HTMLDivElement

	const startWinAnimation = $derived(
		player.slug === $myPlayer?.slug &&
			player.map_position === 102 &&
			$turnState === 'player-win-animation'
	)

	const cellPosition = $derived.by(() => {
		if (startWinAnimation) {
			return getCellPosition(LastMapPosition)
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
			return { x: 160 + 100 * index, y: 20, onlyName: false }
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

	$effect(() => {
		if (element && $turnState === 'selecting-dice' && player.slug === $myPlayer?.slug) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
		}
	})

	$effect(() => {
		if (element && $hoveredPlayer === player.slug) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
		}
	})

	const isHighlighted = $derived($hoveredPlayer === player.slug)

	const onCharacterClick = (e: MouseEvent) => {
		if ($selectedPlayer?.slug === player.slug) {
			selectedPlayer.set(null)
		} else {
			selectedPlayer.set(player)
		}
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
					snake_to: snakeTo ?? null,
					unlocked_achievements: []
				}
			})

			if (player && endCell !== undefined) {
				console.log('Moving player', slug, 'to cell', endCell)
				player.map_position = endCell
			}
		}
	})
</script>

<div
	bind:this={element}
	class="absolute transition-opacity duration-300"
	style="top: {finalTop}px; left: {finalLeft}px; z-index: {isHighlighted ? '50' : 'auto'}"
>
	<button
		onclick={onCharacterClick}
		class="relative isolate cursor-pointer
        rounded-full transition data-[active=false]:hover:bg-yellow-200/80 data-[active=true]:bg-yellow-200/80 data-[highlighted=true]:bg-yellow-200/90 data-[highlighted=true]:ring-4 data-[highlighted=true]:ring-yellow-400"
		data-active={$selectedPlayer?.slug === player.slug}
		data-highlighted={isHighlighted}
	>
		{#if onlyName}
			<div class="flex w-full justify-center p-1">
				<p class="relative left-1/2 -translate-x-1/2">{player.username}</p>
			</div>
		{:else}
			<PlayerModel {player} showUsername variant="small" />
		{/if}
	</button>
</div>
