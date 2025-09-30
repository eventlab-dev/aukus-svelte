<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { Button } from '../ui/button'
	import { ToggleGroupItem } from '../ui/toggle-group'
	import ToggleGroup from '../ui/toggle-group/toggle-group.svelte'
	import type { DiceOption } from '$lib/heyapi/aukus/types.gen'

	const { usersStore, eventDataStore, movementStore, myPlayer } = getAppManagerContext()
	const { finishMove, rollDice } = usersStore
	const { diceOptions, eventDataQuery, myLastMove } = eventDataStore

	const defaultOption = $derived($diceOptions[$diceOptions.length - 1] ?? null)

	let currentOption = $state<DiceOption | null>(null)

	$effect(() => {
		if (defaultOption) {
			currentOption = defaultOption
		}
	})

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

		let rollSum = rollResult.roll_values.reduce((a, b) => a + b, 0)
		if ($myLastMove!.type === 'drop' || $myLastMove!.type === 'sheikh_moment') {
			rollSum = -rollSum
		}

		movementStore.movePlayer({
			playerSlug: $myPlayer!.slug,
			steps: rollSum
		})
		$eventDataQuery.refetch()
	}
</script>

{#if $diceOptions.length > 1 && defaultOption}
	<div class="w-100 rounded-2xl bg-card p-5">
		<ToggleGroup
			type="single"
			value={defaultOption}
			onValueChange={(value) => (currentOption = value as DiceOption)}
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
			<p>Шанс лестницы: 5%</p>
			<p>Шанс змейки: 5%</p>
		</div>
		<Button class="mt-5 w-full" onclick={handleThrowDice}>Бросить кубики</Button>
	</div>
{:else if $diceOptions.length === 1 && defaultOption}
	<div class="w-100 rounded-2xl bg-card p-5">
		<p class="mb-5">Шанс лестницы: 5%</p>
		<p class="mb-5">Шанс змейки: 5%</p>
		<Button
			class="mt-5 w-full"
			onclick={handleThrowDice}
			loading={$rollDice.isPending || $finishMove.isPending}
		>
			Бросить кубики {defaultOption}
		</Button>
	</div>
{/if}
