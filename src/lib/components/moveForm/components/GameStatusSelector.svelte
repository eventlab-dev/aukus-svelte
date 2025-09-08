<script lang="ts">
	import type { MoveType } from '$lib/api/aukus/types';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { formatMs } from '$lib/utils';
	import { onMount } from 'svelte';

	type ItemType = {
		value: MoveType;
		label: string;
	};

	type Props = {
		value?: MoveType;
		gameDuration?: number;
	};

	let { value = $bindable(), gameDuration }: Props = $props();

	const completedLabel = $derived(
		gameDuration ? `Прошёл за — ${formatMs(gameDuration * 1000)}` : 'Прошёл'
	);
	const items: ItemType[] = $derived([
		{ value: 'completed', label: completedLabel },
		{ value: 'drop', label: 'Дроп' },
		{ value: 'reroll', label: 'Рерол' },
		{ value: 'movie', label: 'Просмотровый' },
		{ value: 'sheikh', label: 'Шейх-момент' }
	]);

	const triggerContent = $derived(items.find((f) => f.value === value)?.label ?? 'Выберите игру');
</script>

<Select type="single" bind:value>
	<SelectTrigger class="w-full">{triggerContent}</SelectTrigger>
	<SelectContent>
		{#each items as { value, label }}
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
