<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { derived, get } from 'svelte/store'
	import { Button } from '../ui/button'
	import { ToggleGroupItem } from '../ui/toggle-group'
	import ToggleGroup from '../ui/toggle-group/toggle-group.svelte'
	import type { DiceOption } from '$lib/heyapi/aukus/types.gen'

	const { usersStore, eventDataStore } = getAppManagerContext()
	const { finishMove, rollDice } = usersStore
	const { diceOptions } = eventDataStore

	const defaultOption = derived(diceOptions, ($diceOptions) => {
		return $diceOptions[$diceOptions.length - 1] ?? null
	})

	let currentOption = $state<DiceOption | null>($defaultOption)

	async function handleThrowDice() {
		const rollResult = await get(rollDice).mutateAsync({
			body: {
				dice: currentOption!,
				used: true
			}
		})
		await get(finishMove).mutateAsync({
			body: {
				dice_roll_id: rollResult.id
			}
		})
	}
</script>

{#if $diceOptions.length > 0 && defaultOption}
	<div class="w-100 rounded-2xl bg-card p-5">
		<ToggleGroup
			type="single"
			value={$defaultOption}
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
{/if}
