import { createTimeline } from 'animejs'
import { getMapCellById, getWinnerPosition, type MapCell } from '$lib/mapUtils'
import { SvelteMap } from 'svelte/reactivity'
import type { EventDataStore } from './EventDataStore.svelte'
import { type PlayerData, type PlayerMovementState, type TurnState } from '$lib/types'
import { DICE_ROLL_ANIMATION_TIME, DICE_ROLL_IDLE_TIME, LastMapPosition } from '$lib/constants'
import type { FinishPlayerMoveResponse, PlayerItem } from '$lib/heyapi/aukus/types.gen'
import type { MapStore } from './MapStore.svelte'
import { untrack } from 'svelte'

type Props = {
	getEventDataStore: () => EventDataStore
	getMapStore: () => MapStore
	updateFrontendTurnState: (state: TurnState) => void
	getPlayerSlug: () => string | null
}

export class MovementStore {
	getPlayerSlug: () => string | null
	getEventDataStore: () => EventDataStore
	updateFrontendTurnState: (state: TurnState) => void
	getMapStore: () => MapStore

	constructor(props: Props) {
		this.getEventDataStore = props.getEventDataStore
		this.updateFrontendTurnState = props.updateFrontendTurnState
		this.getMapStore = props.getMapStore
		this.getPlayerSlug = props.getPlayerSlug

		$effect(() => {
			const eventDataStore = this.getEventDataStore()
			const newPlayers = eventDataStore.playersRaw
			const currPlayers = untrack(() => eventDataStore.players)

			if (currPlayers.length === 0) {
				eventDataStore.players = [...newPlayers]
				return
			}

			const myPlayerSlug = this.getPlayerSlug()

			for (const newPlayer of newPlayers) {
				const currPlayer = currPlayers.find((p) => p.slug === newPlayer.slug)
				// Skip animating the current player - they are already animated by moveToCell
				if (currPlayer && currPlayer.map_position !== newPlayer.map_position && newPlayer.slug !== myPlayerSlug) {
					this.animateOtherPlayer(currPlayer, newPlayer)
				} else {
					this.updatePlayer(newPlayer.slug, newPlayer)
				}
			}
		})
	}

	updatePlayer(slug: string, player: Partial<PlayerData>) {
		this.getEventDataStore().players.forEach((p) => {
			if (p.slug === slug) {
				Object.assign(p, player)
			}
		})
	}

	playerElements = $state(new SvelteMap<string, HTMLElement>())
	myMovementState = $state<PlayerMovementState>({
		rollValues: [],
		startCell: 0,
		steps: 0,
		minSteps: 1
	})

	registerPlayer(playerId: string, element: HTMLElement) {
		this.playerElements.set(playerId, element)
	}

	offsetInsideCellX = 0
	offsetInsideCellY = 0

	async moveToCell(params: {
		playerSlug: string
		steps: number
		moveResponse: FinishPlayerMoveResponse
		updatePlayerPosition?: boolean
	}) {
		const element = this.playerElements.get(params.playerSlug)
		if (!element) return

		const eventDataStore = this.getEventDataStore()

		const player = eventDataStore.playersBySlug.get(params.playerSlug)
		if (!player) return

		const isMyPlayer = this.getPlayerSlug() === player.slug

		const startCell = player.map_position

		if (params.steps === 0) return

		const endCell = startCell + params.steps
		const direction = params.steps > 0 ? 1 : -1

		if (isMyPlayer) {
			this.updateFrontendTurnState('player-map-animation')
			this.myMovementState.steps = params.steps
			this.myMovementState.startCell = startCell
		}

		const mapStore = this.getMapStore()
		const offsetInsideCellX = this.offsetInsideCellX
		const offsetInsideCellY = this.offsetInsideCellY

		const cellsPath: MapCell[] = []
		for (let i = 1; i <= Math.abs(params.steps); i++) {
			cellsPath.push(getMapCellById(startCell + i * direction))
		}

		const timeline = createTimeline()
		if (startCell === 0) {
			// move to the start
			timeline.add(element, {
				left: `${mapStore.cellPositionById[0].centerX + offsetInsideCellX}px`,
				top: `${mapStore.cellPositionById[0].centerY + offsetInsideCellY}px`,
				duration: 700,
				easing: 'easeInOutQuad',
				// add "jump" effect
				keyframes: [
					{ translateY: -30, scale: 0.85, duration: 350, easing: 'easeOutQuad' },
					{ translateY: 0, scale: 1, duration: 350, easing: 'easeInQuad' }
				]
			})
		}

		cellsPath.forEach((cell) => {
			const pos = mapStore.cellPositionById[cell.id]
			timeline.add(element, {
				left: `${pos.centerX + offsetInsideCellX}px`,
				top: `${pos.centerY + offsetInsideCellY}px`,
				duration: 700,
				easing: 'easeInOutQuad',
				// add "jump" effect
				keyframes: [
					{ translateY: -30, scale: 0.85, duration: 350, easing: 'easeOutQuad' },
					{ translateY: 0, scale: 1, duration: 350, easing: 'easeInQuad' }
				]
			})
		})

		// const ladder = laddersByCell[endCell]
		if (params.moveResponse.ladder_to) {
			const pos = mapStore.cellPositionById[params.moveResponse.ladder_to]
			timeline.add(element, {
				left: `${pos.centerX + offsetInsideCellX}px`,
				top: `${pos.centerY + offsetInsideCellY}px`,
				duration: 1500,
				easing: 'easeInOutQuad',
				// add "climb" effect
				keyframes: [
					{ translateY: -30, scale: 0.85, duration: 750, easing: 'easeOutQuad' },
					{ translateY: 0, scale: 1, duration: 750, easing: 'easeInQuad' }
				]
			})
		}
		// const snake = snakesByCell[endCell]
		if (params.moveResponse.snake_to) {
			const pos = mapStore.cellPositionById[params.moveResponse.snake_to]
			timeline.add(element, {
				left: `${pos.centerX + offsetInsideCellX}px`,
				top: `${pos.centerY + offsetInsideCellY}px`,
				duration: 1500,
				easing: 'easeInOutQuad',
				keyframes: [
					// add "fall" effect
					{ translateY: 0, scale: 1.1, rotate: 90, duration: 900, easing: 'easeInBounce' },
					{ translateY: 0, scale: 1.1, rotate: 90, duration: 1000, easing: 'easeInBounce' },
					{ translateY: 0, scale: 1, rotate: 0, duration: 200, easing: 'easeOutBounce' }
				]
			})
		}

		await new Promise((resolve) => {
			timeline.play().onComplete = () => {
				resolve(true)
			}
		})

		let finalCell = endCell
		if (params.moveResponse.ladder_to) {
			finalCell = params.moveResponse.ladder_to
		}
		if (params.moveResponse.snake_to) {
			finalCell = params.moveResponse.snake_to
		}

		if (params.updatePlayerPosition) {
			this.updatePlayer(params.playerSlug, {
				map_position: finalCell
			})
		}

		return finalCell
	}

	async moveToWinPosition(params: { playerSlug: string; position: number }) {
		const element = this.playerElements.get(params.playerSlug)
		if (!element) return

		const mapStore = this.getMapStore()

		const startPos = mapStore.cellPositionById[LastMapPosition]
		const finalPos = getWinnerPosition(params.position)

		this.updateFrontendTurnState('player-map-animation')

		const offsetInsideCellX = this.offsetInsideCellX
		const offsetInsideCellY = this.offsetInsideCellY

		const timeline = createTimeline()
		timeline.add(element, {
			top: `${startPos.centerY - mapStore.cellSize + offsetInsideCellY}px`,
			left: `${startPos.centerX + offsetInsideCellX}px`,
			duration: 2000,
			easing: 'easeInOutQuad'
		})
		timeline.add(element, {
			top: `${startPos.centerY - mapStore.cellSize + offsetInsideCellY}px`,
			left: `${finalPos.x}px`,
			duration: 4000,
			easing: 'easeInOutQuad',
			// add "jump" effect
			keyframes: [
				{ translateY: -30, scale: 0.85, duration: 300, easing: 'easeOutQuad' },
				{ translateY: 0, scale: 1, duration: 300, easing: 'easeInQuad' },

				{ translateY: -30, scale: 0.85, duration: 300, easing: 'easeOutQuad' },
				{ translateY: 0, scale: 1, duration: 300, easing: 'easeInQuad' },

				{ translateY: -30, scale: 0.85, duration: 300, easing: 'easeOutQuad' },
				{ translateY: 0, scale: 1, duration: 300, easing: 'easeInQuad' },

				{ translateY: -30, scale: 0.85, duration: 300, easing: 'easeOutQuad' },
				{ translateY: 0, scale: 1, duration: 300, easing: 'easeInQuad' }
			]
		})
		timeline.add(element, {
			left: `${finalPos.x}px`,
			top: `${finalPos.y}px`,
			duration: 2000,
			easing: 'easeInOutQuad'
			// add "jump" effect
			// keyframes: [
			// 	{ translateY: -50, scale: 0.85, duration: 350, easing: 'easeOutQuad' },
			// 	{ translateY: 0, scale: 1, duration: 350, easing: 'easeInQuad' }
			// ]
		})

		await new Promise((resolve) => {
			timeline.play().onComplete = () => {
				resolve(true)
			}
		})
	}

	async doRollAnimation(rollValues: number[], steps: number) {
		if (rollValues.length === 0) {
			throw new Error('rollValues cannot be empty')
		}
		this.myMovementState.rollValues = rollValues
		this.updateFrontendTurnState('dice-animation')
		await new Promise((resolve) => setTimeout(resolve, DICE_ROLL_ANIMATION_TIME))
		this.updateFrontendTurnState('dice-results')
		this.myMovementState.steps = steps
		await new Promise((resolve) => setTimeout(resolve, DICE_ROLL_IDLE_TIME))
	}

	selectedPlayer = $state<PlayerData | null>(null)
	hoveredPlayer = $state<string | null>(null)

	animateOtherPlayer(currPlayer: PlayerItem, newPlayer: PlayerItem) {
		const last_move = newPlayer.last_move
		const element = this.playerElements.get(newPlayer.slug)
		if (
			!element ||
			!last_move ||
			currPlayer.map_position === newPlayer.map_position ||
			newPlayer.map_position > LastMapPosition
		) {
			this.updatePlayer(newPlayer.slug, newPlayer)
			return
		}

		const mapStore = this.getMapStore()
		const offsetInsideCellY = this.offsetInsideCellY
		const offsetInsideCellX = this.offsetInsideCellX

		const cellPosition = mapStore.cellPositionById[currPlayer.map_position]
		element.style.top = `${cellPosition.centerY + offsetInsideCellY}px`
		element.style.left = `${cellPosition.centerX + offsetInsideCellX}px`

		const finalCell = last_move.ladder_from ?? last_move.snake_from ?? last_move.cell_to
		const steps = finalCell - currPlayer.map_position

		this.moveToCell({
			playerSlug: newPlayer.slug,
			moveResponse: {
				unlocked_achievements: [],
				move_to: finalCell,
				ladder_to: last_move.ladder_to,
				snake_to: last_move.snake_to
			},
			steps
		}).then(() => {
			this.updatePlayer(newPlayer.slug, newPlayer)
		})
	}
}
