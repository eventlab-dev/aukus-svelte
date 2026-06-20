<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import {
		laddersByCell,
		snakesByCell,
	} from '$lib/mapUtils'
	import type { PlayerData } from '$lib/types'
	import { onMount } from 'svelte'
	import PlayerModel from './PlayerModel.svelte'

	type Props = {
		player: PlayerData
		asWinner?: boolean
		scale?: number
	}

	const { player, asWinner, scale = 1 }: Props = $props()

	const {
		players,
		eventDataStore,
		movementStore,
		myPlayer,
		turnState,
		playersCompletedMap,
		winners,
		frontendState,
		mapStore
	} = getAppManagerContext()
	const { playersBySlug } = eventDataStore
	const { selectedPlayer, hoveredPlayer } = movementStore

	let element: HTMLDivElement

	const startWinAnimation = $derived(
		player.slug === $myPlayer?.slug &&
			player.map_position === 102 &&
			$turnState === 'player-win-animation'
	)

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

	const doWinJumpAnimation = $derived(
		(asWinner && $winners[0]?.slug === player.slug) || $playersCompletedMap[0]?.slug === player.slug
	)

	const {
		x: cellOffsetX,
		y: cellOffsetY,
		cellPosition,
		onlyName
	} = $derived.by(() => {
		const winnerIndex = $winners.findIndex((p) => p.slug === player.slug)

		if (winnerIndex !== -1) {
			// if (asWinner) {
			const coord = mapStore.winnerPositions[winnerIndex + 1]
			return { x: 0, y: 0, onlyName: false, cellPosition: coord }
			// }

			// const completedIndex = $playersCompletedMap.findIndex((p) => p.slug === player.slug)
			// if (completedIndex !== -1 && !startWinAnimation) {
			// 	const cellPosition: CellPositionNew = mapStore.winnerPositions[player.map_position]
			// 	return { x: 0, y: 0, onlyName: false, cellPosition }
			// }
		}

		const index = playersOnCell.findIndex((p) => p.slug === player.slug)

		const cellPosition = mapStore.cellPositionById[player.map_position]

		if (player.map_position === 0) {
			return { x: 160 + 100 * index, y: 20, onlyName: false, cellPosition }
		}

		if (playersOnCell.length === 1) {
			return { x: 0, y: 0, onlyName: false, cellPosition }
		}

		if (playersOnCell.length === 2) {
			if (index === 0) {
				return { x: 50, y: 0, onlyName: false, cellPosition }
			}
			return { x: -5, y: 35, onlyName: false, cellPosition }
		}

		return {
			x: 20,
			y: 20 + index * 30,
			onlyName: true,
			cellPosition
		}
	})

	const finalTop = $derived(cellPosition.centerY)
	const finalLeft = $derived(cellPosition.centerX)

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
	class="absolute -translate-x-1/2 -translate-y-1/2 scale-120
    transition-opacity duration-300 data-[active=true]:z-10 data-[active=true]:scale-110 data-[highlighted=true]:z-20
    data-[highlighted=true]:scale-110 data-[win-jump=true]:animate-bounce"
	style="top: {finalTop}px; left: {finalLeft}px; z-index: {isHighlighted ? '50' : 'auto'}"
	data-win-jump={doWinJumpAnimation}
>
	<button
		onclick={onCharacterClick}
		class="relative isolate cursor-pointer
        rounded-full transition data-[active=false]:hover:bg-yellow-200/80 data-[active=true]:bg-yellow-200/80 data-[highlighted=true]:bg-yellow-200/90 data-[highlighted=true]:ring-4 data-[highlighted=true]:ring-yellow-400"
		data-active={$selectedPlayer?.slug === player.slug}
		data-highlighted={isHighlighted}
	>
		{#if onlyName}
			<div class="flex w-full items-center justify-center p-1">
				<div class="relative left-1/2 -translate-x-1/2 rounded-md bg-card p-1">
					{player.username}
				</div>
			</div>
		{:else}
			<PlayerModel {player} showUsername variant="small" />
		{/if}
	</button>
</div>
