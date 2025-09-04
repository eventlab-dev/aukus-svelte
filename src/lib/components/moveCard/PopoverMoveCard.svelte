<script lang="ts">
	import type { PlayerMove } from '$lib/api/aukus/types';
	import ArrowRightIcon from '$lib/components/icons/ArrowRightIcon.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { diceRollTextMap } from '$lib/constants';
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';
	import { getMoveTypeStyles } from '$lib/utils';

	type Props = {
		move: PlayerMove;
	};

	const { move }: Props = $props();

	const { playersStore } = getAppManagerContext();
	const { playersById } = playersStore;

	const moveTypeStyles = $derived.by(() => getMoveTypeStyles(move.type));
</script>

<Popover>
	<PopoverTrigger
		class={[buttonVariants({ variant: 'secondary', size: 'sm' }), 'data-[state=open]:bg-primary']}
	>
		{playersById[move.player_id].name}
	</PopoverTrigger>
	<PopoverContent class="w-96 space-y-3">
		<div class="leading-[19px] font-bold">{move.item_title}</div>
		<div class="text-sm leading-[17px] font-medium text-muted-foreground">
			{move.item_review}
		</div>
		<div class="flex gap-1.5">
			<Badge variant="blue">Aukus 3</Badge>
			<Badge variant={moveTypeStyles.variant}>
				{moveTypeStyles.text}
			</Badge>
			{#if move.item_length}
				<Badge variant="secondary">{diceRollTextMap[move.item_length]} HLTB</Badge>
			{/if}
			<Button variant="secondary" size="tiny" class="w-full shrink py-0">
				<ArrowRightIcon class="size-full" />
			</Button>
		</div>
	</PopoverContent>
</Popover>
