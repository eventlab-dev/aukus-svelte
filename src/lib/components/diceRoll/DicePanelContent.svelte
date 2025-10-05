<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { Button } from '../ui/button'
	import type { DiceOption } from '$lib/heyapi/aukus/types.gen'
	import { laddersByCell, snakesByCell } from '$lib/mapUtils'
	import ToggleButtonGroup from './ToggleButtonGroup.svelte'
	import type { PlayerData } from '$lib/types'

	type DiceOptionOrDrop = DiceOption | 'drop'

	type Option = {
		label: string
		value: DiceOptionOrDrop
	}

	type Props = {
		player: PlayerData
		canRollDice: boolean
		diceOptions: DiceOptionOrDrop[]
	}

	const { player, canRollDice, diceOptions }: Props = $props()

	const { usersStore, eventDataStore, movementStore, myPlayer, frontendState } =
		getAppManagerContext()
	const { finishMove, rollDice } = usersStore
	const { eventDataQuery } = eventDataStore
	const { movementState } = movementStore

	const activeDiceOptions: Option[] = $derived.by(() => {
		const allOptions = [
			{ label: 'Дроп', value: 'drop' },
			{ label: '1d4', value: '1d4' },
			{ label: '1d6', value: '1d6' },
			{ label: '2d6', value: '2d6' },
			{ label: '3d6', value: '3d6' }
		] as const
		return allOptions.filter((option) => diceOptions.includes(option.value))
	})

	const defaultOption = $derived(activeDiceOptions[activeDiceOptions.length - 1].value)

	let selectedDiceOption = $state<DiceOption | 'drop' | null>(null)

	$effect(() => {
		selectedDiceOption = defaultOption
	})

	const moveDirection = $derived(selectedDiceOption === 'drop' ? -1 : 1)

	async function handleThrowDice() {
		let dice = selectedDiceOption!
		if (dice === 'drop') {
			dice = player.map_position >= 81 ? '2d6' : '1d6'
		}

		const rollResult = await $rollDice.mutateAsync({
			body: {
				dice,
				used: true
			}
		})
		await $finishMove.mutateAsync({
			body: {
				dice_roll_id: rollResult.id
			}
		})

		const rollSteps = rollResult.roll_values.reduce((a, b) => a + b, 0) * moveDirection
		await movementStore.doRollAnimation(rollResult.roll_values, rollSteps)

		await movementStore.movePlayer({
			playerSlug: $myPlayer!.slug,
			steps: rollSteps
		})
		await $eventDataQuery.refetch()
		frontendState.set(null)
	}

	const { ladderChance, snakeChance, maxRoll } = $derived.by(() => {
		let maxRoll = 0
		switch (selectedDiceOption) {
			case '1d6':
				maxRoll = 6
				break
			case '2d6':
				maxRoll = 12
				break
			case '3d6':
				maxRoll = 18
				break
			case '1d4':
				maxRoll = 4
				break
			case 'drop': {
				if (player.map_position >= 81) {
					maxRoll = -12
				} else {
					maxRoll = -6
				}
				break
			}
			case null:
				maxRoll = 0
				break
			default: {
				const error: never = selectedDiceOption
				throw new Error(`Unsupported dice option: ${error}`)
			}
		}
		let ladders = 0
		let snakes = 0
		const absMaxRoll = Math.abs(maxRoll)
		for (let i = 1; i <= absMaxRoll; i++) {
			const cellId = player.map_position + i * moveDirection
			if (laddersByCell[cellId]) {
				ladders++
			}
			if (snakesByCell[cellId]) {
				snakes++
			}
		}
		return {
			ladderChance: (ladders / absMaxRoll) * 100,
			snakeChance: (snakes / absMaxRoll) * 100,
			maxRoll
		}
	})

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		// canRollDice
		movementState.set({
			rollValues: [],
			startCell: player.map_position,
			steps: maxRoll
		})
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
			return '-2d6'
		}
		return '-1d6'
	}
</script>

<div>
	<div class="flex flex-col gap-2">
		<ToggleButtonGroup bind:selectedOption={selectedDiceOption} options={activeDiceOptions} />
		<div class="flex gap-2">
			<div class="rounded-2xl bg-card p-3">
				<p class="mb-3">Шанс на лестницу</p>
				<p class="text-center text-4xl font-bold">{ladderChance.toFixed(1)}%</p>
			</div>
			<div class="rounded-2xl bg-card p-3">
				<p class="mb-3">Шанс на змейку</p>
				<p class="text-center text-4xl font-bold">{snakeChance.toFixed(1)}%</p>
			</div>
		</div>
		{#if canRollDice}
			<Button
				class="w-full"
				onclick={handleThrowDice}
				loading={$rollDice.isPending || $finishMove.isPending}
			>
				Бросить кубики {selectedDiceOption === 'drop' ? dropDiceText() : selectedDiceOption}
			</Button>
		{/if}
	</div>
</div>
