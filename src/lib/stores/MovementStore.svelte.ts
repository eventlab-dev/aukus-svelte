import { createTimeline } from 'animejs'
import {
	getCellPosition,
	getMapCellById,
	laddersByCell,
	snakesByCell,
	type MapCell
} from '$lib/mapUtils'
import { SvelteMap } from 'svelte/reactivity'
import { get, writable } from 'svelte/store'
import type { EventDataStore } from './EventDataStore.svelte'

export function createMovementStore({ eventDataStore }: { eventDataStore: EventDataStore }) {
	const playerElements = writable(new SvelteMap<string, HTMLElement>())

	const registerPlayer = (playerId: string, element: HTMLElement) => {
		playerElements.update((map) => {
			map.set(playerId, element)
			return map
		})
	}

	const movePlayer = (params: { playerSlug: string; steps: number }) => {
		const element = get(playerElements).get(params.playerSlug)
		if (!element) return

		const player = get(eventDataStore.playersBySlug).get(params.playerSlug)
		if (!player) return

		if (params.steps === 0) return

		const startCell = player.map_position
		let endCell = startCell + params.steps
		let boundSteps = params.steps

		if (endCell < 1) {
			endCell = 1
			boundSteps = 1 - startCell
		}

		const direction = params.steps > 0 ? 1 : -1

		const cellsPath: MapCell[] = []
		for (let i = 1; i <= Math.abs(boundSteps); i++) {
			cellsPath.push(getMapCellById(startCell + i * direction))
		}

		const offsetInsideCellX = 25
		const offsetInsideCellY = 15

		const timeline = createTimeline()
		cellsPath.forEach((cell) => {
			const pos = getCellPosition(cell.id)
			timeline.add(element, {
				left: `${pos.x + offsetInsideCellX}px`,
				top: `${pos.y + offsetInsideCellY}px`,
				duration: 700,
				easing: 'easeInOutQuad',
				// add "jump" effect
				keyframes: [
					{ translateY: -30, scale: 0.85, duration: 350, easing: 'easeOutQuad' },
					{ translateY: 0, scale: 1, duration: 350, easing: 'easeInQuad' }
				]
			})
		})

		const ladder = laddersByCell[endCell]
		if (ladder) {
			const pos = getCellPosition(ladder.cellTo)
			timeline.add(element, {
				left: `${pos.x + offsetInsideCellX}px`,
				top: `${pos.y + offsetInsideCellY}px`,
				duration: 1500,
				easing: 'easeInOutQuad',
				// add "climb" effect
				keyframes: [
					{ translateY: -30, scale: 0.85, duration: 750, easing: 'easeOutQuad' },
					{ translateY: 0, scale: 1, duration: 750, easing: 'easeInQuad' }
				]
			})
		}
		const snake = snakesByCell[endCell]
		if (snake) {
			const pos = getCellPosition(snake.cellTo)
			timeline.add(element, {
				left: `${pos.x + offsetInsideCellX}px`,
				top: `${pos.y + offsetInsideCellY}px`,
				duration: 1500,
				easing: 'easeInOutQuad',
				keyframes: [
					// add "fall" effect
					{ translateY: 0, scale: 1.1, rotate: 90, duration: 900, easing: 'easeInBounce' },
					{ translateY: 0, scale: 1.1, rotate: 90, duration: 5000, easing: 'easeInBounce' },
					{ translateY: 0, scale: 1, rotate: 0, duration: 200, easing: 'easeOutBounce' }
				]
			})
		}

		return timeline.init()
	}

	return {
		registerPlayer,
		movePlayer
	}
}
