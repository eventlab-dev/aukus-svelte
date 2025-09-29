import { createTimeline } from 'animejs'
import { getCellPosition, getMapCellById, type MapCell } from '$lib/mapUtils'
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

	const movePlayer = (playerId: string, cellTo: number) => {
		const element = get(playerElements).get(playerId)
		if (!element) return

		const player = get(eventDataStore.playersBySlug).get(playerId)
		if (!player) return

		const currentCell = player.map_position
		if (currentCell === cellTo) return

		const direction = cellTo > currentCell ? 'forward' : 'backward'

		const cellsPath: MapCell[] = []
		if (direction === 'forward') {
			for (let i = currentCell + 1; i <= cellTo; i++) {
				cellsPath.push(getMapCellById(i))
			}
		} else {
			for (let i = currentCell - 1; i >= cellTo; i--) {
				cellsPath.push(getMapCellById(i))
			}
		}

		const timeline = createTimeline()
		cellsPath.forEach((cell) => {
			const pos = getCellPosition(cell.id)
			timeline.add(element, {
				left: `${pos.x}px`,
				top: `${pos.y}px`,
				duration: 300,
				easing: 'easeInOutQuad'
			})
		})
		return timeline.init()
	}

	return {
		registerPlayer,
		movePlayer
	}
}
