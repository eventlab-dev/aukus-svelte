<script lang="ts">
	import { EventTitles } from '$lib/constants'
	import type { CommonGameItem } from '$lib/types'
	import { formatDuration, getMoveTypeStyles, renderToHTML } from '$lib/utils'
	import { Badge } from '../ui/badge'

	type Props = {
		game: CommonGameItem
	}

	let { game }: Props = $props()

	const parsedReview = $derived(renderToHTML(game.review || ''))
	const moveTypeStyles = $derived(getMoveTypeStyles(game.completion_status))
</script>

<div class="w-fit max-w-[500px] space-y-5">
	<div class="font-bold text-xl">{game.game_title}</div>
	<div class="text-sm leading-[18px] font-medium text-muted-foreground">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html parsedReview}
	</div>
	<div class="mt-2 flex gap-1.5">
		<Badge variant="blue">{EventTitles[game.event_name]}</Badge>
		<Badge variant={moveTypeStyles.variant}>
			{moveTypeStyles.text}
		</Badge>
		{#if game.rating.length > 0}
			<Badge variant="default">
				{game.rating}
			</Badge>
		{/if}
		{#if game.game_time > 0}
			<Badge variant="orange">
				Играл
				{formatDuration(game.game_time)}
			</Badge>
		{/if}
	</div>
</div>
