<script lang="ts">
	import type { PlayerMove } from '$lib/api/aukus/types';
	import ArrowRightIcon from '$lib/components/icons/ArrowRightIcon.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { gameLengthRanges } from '$lib/constants';
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';
	import { getMoveTypeStyles } from '$lib/utils';

	type Props = {
		move: PlayerMove;
	};

	const { move }: Props = $props();

	const { playersStore } = getAppManagerContext();

	const player = $derived.by(() => playersStore.getPlayer(move.player_id));
	const moveTypeStyles = $derived.by(() => getMoveTypeStyles(move.type));
</script>

<Popover>
	<PopoverTrigger
		class={[buttonVariants({ variant: 'secondary', size: 'sm' }), 'data-[state=open]:bg-primary']}
	>
		{player?.name}
	</PopoverTrigger>
	<PopoverContent class="w-[346px] space-y-3">
		<div class="font-bold">{move.item_title}</div>
		<div class="text-sm leading-[18px] font-medium text-muted-foreground">
			{move.item_review}
		</div>
		<div class="flex gap-1.5">
			<Badge variant="blue">Aukus 3</Badge>
			<Badge variant={moveTypeStyles.variant}>
				{moveTypeStyles.text}
			</Badge>
			{#if move.item_length}
				<Badge variant="secondary">{gameLengthRanges[move.item_length]} HLTB</Badge>
			{/if}
			<Button variant="secondary" size="tiny" class="w-full shrink py-0">
				<ArrowRightIcon class="size-full" />
			</Button>
		</div>
	</PopoverContent>
</Popover>
