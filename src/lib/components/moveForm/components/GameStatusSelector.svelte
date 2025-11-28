<script lang="ts">
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select'
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import type { PlayerMoveType } from '$lib/heyapi/aukus/types.gen'
	import { formatMs } from '$lib/utils'

	type ItemType = {
		value: PlayerMoveType
		label: string
	}

	type Props = {
		value?: PlayerMoveType
		gameDuration?: number
	}

	let { value = $bindable(), gameDuration }: Props = $props()

	const completedLabel = $derived(
		gameDuration ? `Прошёл игру за — ${formatMs(gameDuration * 1000)}` : 'Прошёл игру'
	)
	const items: ItemType[] = $derived([
		{ value: 'completed', label: completedLabel },
		{ value: 'drop', label: 'Дроп' },
		{ value: 'reroll', label: 'Рерол' },
		{ value: 'movie', label: 'Просмотровый' },
		{ value: 'sheikh_moment', label: 'Шейх-момент (дроп)' }
	])

	const triggerContent = $derived(items.find((f) => f.value === value)?.label ?? 'Выбери игру')
</script>

<Select type="single" bind:value>
	<SelectTrigger class="w-60">{triggerContent}</SelectTrigger>
	<SelectContent>
		{#each items as { value, label } (value)}
			{#if value === 'completed' && gameDuration}
				<Tooltip disableHoverableContent>
					<TooltipTrigger>
						{#snippet child({ props })}
							<SelectItem {...props} {value}>{label}</SelectItem>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent side="right" class="max-w-[260px]">
						Примерное время прохождения по категории стрима
					</TooltipContent>
				</Tooltip>
			{:else}
				<SelectItem {value}>{label}</SelectItem>
			{/if}
		{/each}
	</SelectContent>
</Select>
