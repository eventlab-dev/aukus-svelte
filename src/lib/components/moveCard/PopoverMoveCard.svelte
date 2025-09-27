<script lang="ts">
	import ArrowRightIcon from '$lib/components/icons/ArrowRightIcon.svelte'
	import { Badge } from '$lib/components/ui/badge'
	import { Button, buttonVariants } from '$lib/components/ui/button'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
	import { gameLengthRanges } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import { getMoveTypeStyles, renderToHTML } from '$lib/utils'

	type Props = {
		move: PlayerMoveItem
	}

	const { move }: Props = $props()

	const { playersBySlug } = getAppManagerContext()

	const parsedReview = $derived.by(() => renderToHTML(move.item_review || ''))
	const player = $derived($playersBySlug[move.player_slug])
	const moveTypeStyles = $derived.by(() => getMoveTypeStyles(move.type))
</script>

<Popover>
	<PopoverTrigger
		class={[buttonVariants({ variant: 'secondary', size: 'sm' }), 'data-[state=open]:bg-primary']}
	>
		{player.username}
	</PopoverTrigger>
	<PopoverContent class="w-[346px] space-y-3">
		<div class="font-bold">{move.item_title}</div>
		<div class="text-sm leading-[18px] font-medium text-muted-foreground">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html parsedReview}
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
