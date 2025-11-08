<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { Button } from '../ui/button'
	import type { DiceOption } from '$lib/heyapi/aukus/types.gen'
	import { laddersByCell, snakesByCell } from '$lib/mapUtils'
	import ToggleButtonGroup from './ToggleButtonGroup.svelte'
	import type { PlayerData } from '$lib/types'
	import { normalizeSteps } from '$lib/utils'
	import PlayerModel from '../map/PlayerModel.svelte'
	import { Separator } from '../ui/separator'
	import ImageLoader from '../ImageLoader.svelte'
	import { FALLBACK_GAME_POSTER } from '$lib/constants'
	import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

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

	const { usersStore, eventDataStore, movementStore, myPlayer, frontendState, notificationStore } =
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

		const rollResult = await $rollDice.mutateAsync({
			body: {
				dice,
				used: true,
				test_values: 'diceRoll' in window ? ((window.diceRoll as number[]) ?? []) : []
			}
		})
		const moveParams = await $finishMove.mutateAsync({
			body: {
				dice_roll_id: rollResult.id
			}
		})

		const steps = moveParams.move_to - player.map_position
		await movementStore.doRollAnimation(rollResult.roll_values, steps)
		await movementStore.moveToCell({
			playerSlug: $myPlayer!.slug,
			steps: steps,
			moveResponse: moveParams
		})
		if (moveParams.unlocked_achievements.length > 0) {
			await new Promise((resolve) => setTimeout(resolve, 500))
			notificationStore.notify(moveParams.unlocked_achievements)
		}
		await $eventDataQuery.refetch()
		frontendState.set(null)
	}

	const { ladderChance, snakeChance, maxRoll, ladders, snakes } = $derived.by(() => {
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
		const ladders = []
		const snakes = []
		const absMaxRoll = Math.abs(maxRoll)
		for (let i = 1; i <= absMaxRoll; i++) {
			const cellId = player.map_position + i * moveDirection
			if (laddersByCell[cellId]) {
				ladders.push(cellId)
			}
			if (snakesByCell[cellId]) {
				snakes.push(cellId)
			}
		}
		return {
			ladderChance: (ladders.length / absMaxRoll) * 100,
			snakeChance: (snakes.length / absMaxRoll) * 100,
			maxRoll,
			snakes,
			ladders
		}
	})

	$effect(() => {
		movementState.set({
			rollValues: [],
			startCell: player.map_position,
			steps: normalizeSteps(player.map_position, maxRoll)
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
			return '2d6'
		}
		return '1d6'
	}
</script>

{#if canRollDice}
	<div class="flex min-w-[500px] flex-col gap-3 rounded-3xl bg-card p-3">
		<div class="font-semibold text-muted-foreground">Варианты хода</div>
		<ToggleButtonGroup bind:selectedOption={selectedDiceOption} options={activeDiceOptions} />
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
			loading={$rollDice.isPending || $finishMove.isPending}
		>
			Бросить кубики — {selectedDiceOption === 'drop' ? dropDiceText() : selectedDiceOption}
		</Button>
	</div>
{:else}
	<div class="flex rounded-3xl bg-card">
		<div class="flex w-[380px] flex-col gap-3 p-4">
			<div class="flex items-center gap-2">
				<Avatar class="size-[27px]">
					<AvatarImage src="https://github.com/shadcn.png" />
					<AvatarFallback class="uppercase">{player.username.slice(0, 2)}</AvatarFallback>
				</Avatar>
				<Button variant="link" class="p-0" href={`/players/${player.slug}`}>
					<div class="text-xl font-bold text-foreground">{player.username}</div>
				</Button>
			</div>
			<div class="text-sm font-semibold text-muted-foreground">Выпало на ауке</div>
			<div class="flex gap-2">
				<ImageLoader
					class="h-[90px]"
					alt="poster"
					src={player.current_game_cover || FALLBACK_GAME_POSTER}
				/>
				<div class="font-bold">{player.current_game}</div>
			</div>
		</div>
		<Separator orientation="vertical" />
		<div class="flex items-center">
			<PlayerModel {player} variant="big" />
		</div>
		<Separator orientation="vertical" />
		<div class="flex w-[380px] flex-col gap-3 p-4 font-bold">
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
