<script lang="ts">
	import { Badge } from '$lib/components/ui/badge'
	import { buttonVariants } from '$lib/components/ui/button'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
	import { gameLengthRanges } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import { formatDuration, getMoveTypeStyles, renderToHTML } from '$lib/utils'

	type Props = {
		move: PlayerMoveItem
		eventName: string
	}

	const { move, eventName }: Props = $props()

	const { playersBySlug } = getAppManagerContext()

	const parsedReview = $derived(renderToHTML(move.item_review || ''))
	const player = $derived($playersBySlug[move.player_slug])
	const moveTypeStyles = $derived(getMoveTypeStyles(move.type))

	let open = $state(false)

	let closeTimeout: number | undefined = undefined

	function handleMouseEnter() {
		clearTimeout(closeTimeout)
		open = true
	}

	function handleMouseLeave() {
		clearTimeout(closeTimeout)
		closeTimeout = setTimeout(() => {
			open = false
		}, 300)
	}
</script>

<Popover {open} onOpenChange={(value) => (open = value)}>
	<PopoverTrigger
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
		class={[buttonVariants({ variant: 'secondary', size: 'sm' }), 'data-[state=open]:bg-primary']}
	>
		{player.username}
	</PopoverTrigger>
	<PopoverContent
		class="w-[375px] space-y-3"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
	>
		<div class="font-bold">{move.item_title}</div>
		<div class="text-sm leading-[18px] font-medium text-muted-foreground">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html parsedReview}
		</div>
		<div class="flex gap-1.5">
			<Badge variant="blue">{eventName}</Badge>
			<Badge variant={moveTypeStyles.variant}>
				{moveTypeStyles.text}
			</Badge>
			{#if move.item_length}
				<Badge variant="secondary">{gameLengthRanges[move.item_length]} HLTB</Badge>
			{/if}
			<Badge variant="secondary" class="w-full shrink py-0"
				>Играл {formatDuration(move.item_duration)}</Badge
			>
		</div>
	</PopoverContent>
</Popover>
