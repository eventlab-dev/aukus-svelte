<script lang="ts">
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import type { PlayerMoveType } from '$lib/heyapi/aukus/types.gen'
	import { formatMs } from '$lib/utils'

	type ItemType = {
		value: PlayerMoveType
		label: string
		tooltip?: string
	}

	type Props = {
		value?: PlayerMoveType
		gameDuration?: number
	}

	let { value = $bindable(), gameDuration }: Props = $props()

	const completedLabel = $derived(
		gameDuration
			? `Прошёл игру за — ${formatMs(gameDuration * 1000, { noDays: true })}`
			: 'Прошёл игру'
	)
	const items: ItemType[] = $derived([
		{
			value: 'completed',
			label: completedLabel,
			tooltip: 'Примерное время прохождения по категории стрима'
		},
		{ value: 'drop', label: 'Дроп' },
		{ value: 'reroll', label: 'Рерол' },
		{ value: 'movie', label: 'Просмотровый' },
		{ value: 'sheikh_moment', label: 'Шейх-дроп' }
	])
</script>

<Tabs value={value ?? ''} onValueChange={(v) => (value = v as PlayerMoveType)}>
	<TabsList class="flex w-full flex-wrap gap-2">
		{#each items as { value: itemValue, label, tooltip } (itemValue)}
			{#if tooltip}
				<Tooltip disableHoverableContent>
					<TooltipTrigger>
						{#snippet child({ props })}
							<TabsTrigger {...props} value={itemValue} class="flex-1 uppercase"
								>{label}</TabsTrigger
							>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent side="top" class="max-w-[260px]">
						{tooltip}
					</TooltipContent>
				</Tooltip>
			{:else}
				<TabsTrigger value={itemValue} class="flex-1 uppercase">{label}</TabsTrigger>
			{/if}
		{/each}
	</TabsList>
</Tabs>
