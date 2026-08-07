<script lang="ts">
	import { Button } from '../ui/button'
	import type { DiceOption } from '$lib/heyapi/aukus/types.gen'
	import { laddersByCell, snakesByCell } from '$lib/mapUtils'
	import ToggleButtonGroup from './ToggleButtonGroup.svelte'
	import type { PlayerData } from '$lib/types'
	import { normalizeSteps, calculateDiceProbability, type DiceProbability } from '$lib/utils'
	import PlayerModel from '../map/PlayerModel.svelte'
	import ImageLoader from '../ImageLoader.svelte'
	import { FALLBACK_GAME_POSTER, FALLBACK_AVATAR_URL } from '$lib/constants'
	import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
	import KickPlayerDialog from '../quickMenu/options/shitMenu/KickPlayerDialog.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	type DiceOptionOrDrop = DiceOption | 'drop'

	type Option = {
		label: string
		value: DiceOptionOrDrop
		tooltip?: string
	}

	type Props = {
		player: PlayerData
		canRollDice: boolean
		diceOptions: DiceOptionOrDrop[]
	}

	const { player, canRollDice, diceOptions }: Props = $props()

	const app = getAppManager()

	const {
		usersStore,
		eventDataStore,
		movementStore,
		notificationStore,
		statsStore
	} = app

	const activeDiceOptions: Option[] = $derived.by(() => {
		const allOptions: Option[] = [
			{ label: 'Дроп', value: 'drop' },
			{ label: '1d2', value: '1d2', tooltip: 'Игры 0-4ч' },
			{ label: '1d4', value: '1d4', tooltip: 'Игры 5-10ч' },
			{ label: '2d4', value: '2d4', tooltip: 'Игры 11-16ч' },
			{ label: '1d6', value: '1d6', tooltip: 'Игры 11+ч' },
			{ label: '2d6', value: '2d6', tooltip: 'Игры 17-24ч' },
			{ label: '3d6', value: '3d6', tooltip: 'Игры 25-40ч' },
			{ label: '4d6', value: '4d6', tooltip: 'Игры 40+ч' }
		]
		return allOptions.filter((option) => diceOptions.includes(option.value))
	})

	const defaultOption = $derived(activeDiceOptions[activeDiceOptions.length - 1].value)

	let selectedDiceOption = $state<DiceOption | 'drop' | null>(null)

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		player
		selectedDiceOption = defaultOption
	})

	const moveDirection = $derived(selectedDiceOption === 'drop' ? -1 : 1)

	async function handleThrowDice() {
		let dice = selectedDiceOption!
		if (dice === 'drop') {
			dice = player.map_position >= 81 ? '2d6' : '1d6'
		}

		const myPlayerBeforeRoll = app.myPlayer!

		const rollResult = await usersStore.rollDice.mutateAsync({
			body: {
				dice,
				used: true,
				test_values: 'diceRoll' in window ? (window.diceRoll as number[]) : []
			}
		})
		const moveParams = await usersStore.finishMove.mutateAsync({
			body: {
				dice_roll_id: rollResult.id
			}
		})

		const steps = moveParams.move_to - player.map_position
		await movementStore.doRollAnimation(rollResult.roll_values, steps)
		await movementStore.moveToCell({
			player: myPlayerBeforeRoll,
			steps: steps,
			moveResponse: moveParams,
			updatePlayerPosition: true
		})
		if (moveParams.unlocked_achievements.length > 0) {
			await new Promise((resolve) => setTimeout(resolve, 500))
			notificationStore.notify(moveParams.unlocked_achievements)
		}
		await eventDataStore.eventDataQuery.refetch()
		await statsStore.statsQuery.refetch()
		app.frontendState = null
	}

	const { ladderChance, snakeChance, maxRoll, minRoll, ladders, snakes } = $derived.by(() => {
		let maxRoll = 0
		let minRoll = 1
		let probabilities: DiceProbability | null = null
		switch (selectedDiceOption) {
			case '1d6':
				maxRoll = 6
				minRoll = 1
				probabilities = calculateDiceProbability(1, 6)
				break
			case '2d6':
				maxRoll = 12
				minRoll = 2
				probabilities = calculateDiceProbability(2, 6)
				break
			case '3d6':
				maxRoll = 18
				minRoll = 3
				probabilities = calculateDiceProbability(3, 6)
				break
			case '4d6':
				maxRoll = 24
				minRoll = 4
				probabilities = calculateDiceProbability(4, 6)
				break
			case '1d4':
				maxRoll = 4
				minRoll = 1
				probabilities = calculateDiceProbability(1, 4)
				break
			case '2d4':
				maxRoll = 8
				minRoll = 2
				probabilities = calculateDiceProbability(2, 4)
				break
			case '3d4':
				maxRoll = 12
				minRoll = 3
				probabilities = calculateDiceProbability(3, 4)
				break
			case '1d2':
				maxRoll = 2
				minRoll = 1
				probabilities = calculateDiceProbability(1, 2)
				break
			case 'drop': {
				if (player.map_position >= 81) {
					maxRoll = -12
					minRoll = -2
					probabilities = calculateDiceProbability(2, 6)
				} else {
					maxRoll = -6
					minRoll = -1
					probabilities = calculateDiceProbability(1, 6)
				}
				break
			}
			case null:
				maxRoll = 0
				minRoll = 0
				break
			default: {
				const error: never = selectedDiceOption
				throw new Error(`Unsupported dice option: ${error}`)
			}
		}

		// slow down on going through 81 cell
		if (player.map_position < 81 && player.map_position + maxRoll > 81) {
			const diff = 81 - player.map_position
			const remaining = Math.floor((maxRoll - diff) / 2)
			maxRoll = diff + remaining
		}

		const ladders = []
		const snakes = []
		const absMaxRoll = Math.abs(maxRoll)
		for (let i = Math.abs(minRoll); i <= absMaxRoll; i++) {
			const cellId = player.map_position + i * moveDirection
			if (laddersByCell[cellId]) {
				ladders.push(cellId)
			}
			if (snakesByCell[cellId]) {
				snakes.push(cellId)
			}
		}

		// console.log('prob', probabilities)

		const ladderChance =
			100 *
			ladders.reduce((acc, v) => {
				const diff = Math.abs(v - player.map_position)
				if (probabilities?.[diff]) {
					return acc + probabilities[diff]
				}
				return acc
			}, 0)

		const snakeChance =
			100 *
			snakes.reduce((acc, v) => {
				const diff = Math.abs(v - player.map_position)
				if (probabilities?.[diff]) {
					return acc + probabilities[diff]
				}
				return acc
			}, 0)

		return {
			ladderChance,
			snakeChance,
			maxRoll,
			minRoll,
			snakes,
			ladders
		}
	})

	$effect(() => {
		movementStore.myMovementState = {
			rollValues: [],
			startCell: player.map_position,
			steps: normalizeSteps(player.map_position, maxRoll),
			minSteps: minRoll
		}
		// movementState.set({
		// 	direction: 'forward',
		// 	rollValues: [3, 5],
		// 	state: 'dice-results',
		// 	steps: 3,
		// 	startCell: 5
		// })
	})

	function dropDiceText() {
		if (player.map_position >= 81) {
			return '2d6'
		}
		return '1d6'
	}

	const canKick = $derived(player.slug !== app.myPlayer?.slug)
</script>

{#if canRollDice}
	<div class="flex min-w-[500px] flex-col gap-3 rounded-3xl bg-card p-3">
		<div class="font-semibold text-muted-foreground">Бросок кубика</div>
		<div class="flex gap-3">
			<div class="flex-1 rounded-2xl bg-secondary p-3">
				<p class="mb-1.5 text-sm font-semibold">Шанс на лестницу</p>
				<p class="text-left text-2xl font-bold">
					{ladderChance.toFixed(1)}%
					{#if ladders.length > 0}
						<span class="text-muted-foreground">— {ladders.join(', ')}</span>
					{/if}
				</p>
			</div>
			<div class="flex-1 rounded-2xl bg-secondary p-3">
				<p class="mb-1.5 text-sm font-semibold">Шанс на змейку</p>
				<p class="text-left text-2xl font-bold">
					{snakeChance.toFixed(1)}%
					{#if snakes.length > 0}
						<span class="text-muted-foreground">— {snakes.join(', ')}</span>
					{/if}
				</p>
			</div>
		</div>
		<Button
			class="w-full"
			onclick={handleThrowDice}
			loading={usersStore.rollDice.isPending || usersStore.finishMove.isPending}
		>
			Бросить кубики — {selectedDiceOption === 'drop' ? dropDiceText() : selectedDiceOption}
		</Button>
	</div>
{:else}
	<div class="flex">
		<div class="bg-card flex w-[450px] flex-col gap-3 p-4 border-dashed rounded-[32px]">
			<div class="flex justify-between">
				<div class="flex items-center gap-2">
					<Avatar class="size-[27px]">
						<AvatarImage src={player.avatar_link || FALLBACK_AVATAR_URL} />
						<AvatarFallback class="uppercase">{player.username.slice(0, 2)}</AvatarFallback>
					</Avatar>
					<Button variant="link" class="p-0" href={`/players/${player.slug}`}>
						<div class="text-xl font-bold text-foreground">{player.username}</div>
					</Button>
				</div>
				{#if canKick}
					<KickPlayerDialog {player} />
				{/if}
			</div>
			<div class="text-sm font-semibold text-muted-foreground">Игра на стриме</div>
			<div class="flex gap-2">
				{#if player.current_game}
					<ImageLoader
						class="h-[90px]"
						alt="poster"
						src={player.current_game_cover || FALLBACK_GAME_POSTER}
					/>
				{/if}
				<div class="font-bold">{player.current_game || 'Выбирает игру...'}</div>
			</div>
		</div>
		<div class="bg-card flex items-center border-dashed rounded-[32px]">
			<PlayerModel {player} variant="big" />
		</div>
		<div class="bg-card flex flex-col gap-3 p-4 font-bold border-dashed rounded-[32px]">
			<div class="font-semibold text-muted-foreground">Варианты хода</div>
			<ToggleButtonGroup bind:selectedOption={selectedDiceOption} options={activeDiceOptions} />
			<div class="flex w-full gap-2">
				<div class="flex-1 rounded-2xl bg-secondary p-3">
					<p class="mb-1.5 text-sm font-semibold">Шанс на лестницу</p>
					<p class="text-left text-2xl font-bold">
						{ladderChance.toFixed(1)}%
					</p>
				</div>
				<div class="flex-1 rounded-2xl bg-secondary p-3">
					<p class="mb-1.5 text-sm font-semibold">Шанс на змейку</p>
					<p class="text-left text-2xl font-bold">
						{snakeChance.toFixed(1)}%
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}
