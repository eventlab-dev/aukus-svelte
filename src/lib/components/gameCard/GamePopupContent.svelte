<script lang="ts">
	import { EventTitles } from '$lib/constants'
	import type { CommonGameItem } from '$lib/types'
	import { formatDuration, getMoveTypeStyles, renderToHTML } from '$lib/utils'
	import { Badge } from '../ui/badge'
	import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
	import BorderedBox from '../BorderedBox.svelte'

	type Props = {
		game: CommonGameItem
		playerName?: string
		playerIcon?: string
	}

	let { game, playerName, playerIcon }: Props = $props()

	const parsedReview = $derived(renderToHTML(game.review || ''))
	const moveTypeStyles = $derived(getMoveTypeStyles(game.completion_status))
</script>

<BorderedBox class="w-full p-3">
	{#if playerName}
		<div class="flex min-w-0 items-center">
			<Avatar class="size-8 shrink-0">
				<AvatarImage src={playerIcon ?? ''} />
				<AvatarFallback class="text-[10px] uppercase">
					{playerName.slice(0, 2)}
				</AvatarFallback>
			</Avatar>
			<div
				class="ml-[6px] truncate font-display text-xl font-extrabold text-ice"
			>
				{playerName}
			</div>
		</div>
	{/if}
	<div class="mt-3 flex flex-wrap gap-1.5">
		<Badge variant={moveTypeStyles.variant} class="text-sm uppercase">
			{moveTypeStyles.text}
		</Badge>
		<Badge variant="blue" class="text-sm uppercase">{EventTitles[game.event_name]}</Badge>
		{#if game.game_time > 0}
			<!-- Без капса: в этом шрифте заглавная Ч выглядит как 4 -->
			<Badge variant="blue" class="text-sm">
				За {formatDuration(game.game_time)}
			</Badge>
		{/if}
	</div>
	<div class="mt-3 font-display text-xl font-extrabold text-ice">
		{game.game_title}
	</div>
	<div class="review mt-2 font-display text-base font-bold uppercase italic text-ice">
		{#if game.rating.length > 0}{game.rating} — {/if}<!-- eslint-disable-next-line svelte/no-at-html-tags -->{@html parsedReview}
	</div>
</BorderedBox>

<style>
	:global(.review) :global(p) {
		display: inline;
		margin: 0;
	}
</style>
