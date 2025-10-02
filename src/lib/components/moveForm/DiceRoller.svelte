<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { Button } from '../ui/button'
	import { ToggleGroupItem } from '../ui/toggle-group'
	import ToggleGroup from '../ui/toggle-group/toggle-group.svelte'
	import type { DiceOption } from '$lib/heyapi/aukus/types.gen'
	import { laddersByCell, snakesByCell } from '$lib/mapUtils'

	const { usersStore, eventDataStore, movementStore, myPlayer } = getAppManagerContext()
	const { finishMove, rollDice } = usersStore
	const { diceOptions, eventDataQuery, myLastMove } = eventDataStore

	let currentOption = $state<DiceOption>($diceOptions[$diceOptions.length - 1])

	const moveDirection = $derived(
		$myLastMove?.type === 'drop' || $myLastMove?.type === 'sheikh_moment' ? -1 : 1
	)

	async function handleThrowDice() {
		const rollResult = await $rollDice.mutateAsync({
			body: {
				dice: currentOption!,
				used: true
			}
		})
		await $finishMove.mutateAsync({
			body: {
				dice_roll_id: rollResult.id
			}
		})

		const rollSteps = rollResult.roll_values.reduce((a, b) => a + b, 0) * moveDirection

		movementStore.movePlayer({
			playerSlug: $myPlayer!.slug,
			steps: rollSteps
		})
		$eventDataQuery.refetch()
	}

	const { ladderChance, snakeChance, maxRoll } = $derived.by(() => {
		if (currentOption === null || !$myPlayer) {
			return { ladderChance: 0, snakeChance: 0, maxRoll: 0 }
		}
		let maxRoll = 0
		switch (currentOption) {
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
			default: {
				const error: never = currentOption
				throw new Error(`Unsupported dice option: ${error}`)
			}
		}
		let ladders = 0
		let snakes = 0
		for (let i = 1; i <= maxRoll; i++) {
			const cellId = $myPlayer.map_position + i * moveDirection
			if (laddersByCell[cellId]) {
				ladders++
			}
			if (snakesByCell[cellId]) {
				snakes++
			}
		}
		return {
			ladderChance: (ladders / maxRoll) * 100,
			snakeChance: (snakes / maxRoll) * 100,
			maxRoll
		}
	})

	$effect(() => {
		if (currentOption && $myPlayer) {
			movementStore.movementParams.set({
				direction: moveDirection === 1 ? 'forward' : 'backward',
				startCell: $myPlayer.map_position,
				steps: maxRoll * moveDirection
			})
		}
	})

	function getDiceOption() {
		return currentOption
	}

	function setDiceOption(value: string) {
		if (value) {
			currentOption = value as DiceOption
		}
	}
</script>

{#if $diceOptions.length > 1 && currentOption}
	<div class="w-100 rounded-2xl bg-card p-5">
		<ToggleGroup
			type="single"
			bind:value={getDiceOption, setDiceOption}
			variant="outline"
			class="w-full"
		>
			{#each $diceOptions as option (option)}
				<ToggleGroupItem value={option} class="data-[state=on]:bg-primary">
					{option}
				</ToggleGroupItem>
			{/each}
		</ToggleGroup>
		<div class="py-5">
			<p>Шанс лестницы: {ladderChance.toFixed(1)}%</p>
			<p>Шанс змейки: {snakeChance.toFixed(1)}%</p>
		</div>
		<Button class="mt-5 w-full" onclick={handleThrowDice}>Бросить кубики {currentOption}</Button>
	</div>
{:else if $diceOptions.length === 1 && currentOption}
	<div class="w-100 rounded-2xl bg-card p-5">
		<p class="mb-5">Шанс лестницы: {ladderChance.toFixed(1)}%</p>
		<p class="mb-5">Шанс змейки: {snakeChance.toFixed(1)}%</p>
		<Button
			class="mt-5 w-full"
			onclick={handleThrowDice}
			loading={$rollDice.isPending || $finishMove.isPending}
		>
			Бросить кубики {currentOption}
		</Button>
	</div>
{/if}
