<script lang="ts">
	import ImageLoader from '$lib/components/ImageLoader.svelte'
	import PopoverGameCard from '$lib/components/moveCard/PopoverGameCard.svelte'
	import { Badge } from '$lib/components/ui/badge'
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import { EventTitles } from '$lib/constants'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import type { CommonGameItem } from '$lib/types'
	import { formatDuration, getMoveTypeStyles, renderToHTML } from '$lib/utils'
	import { fade } from 'svelte/transition'

	type Props = {
		game: CommonGameItem
		matchedGames: CommonGameItem[]
	}

	const { game, matchedGames }: Props = $props()

	const app = getAppManager()

	const player = $derived(app.playersBySlug.get(game.player_nickname.toLowerCase()))
	const categoryDuration = $derived(formatDuration(game.game_time))

	const moveTypeStyles = $derived(getMoveTypeStyles(game.completion_status))
	const parsedReview = $derived(renderToHTML(game.review))
</script>

<div
	class="group relative flex w-full flex-col rounded-xl bg-[#2c2c2c] p-3 data-[current=true]:bg-primary data-[current=true]:selection:bg-foreground data-[current=true]:selection:text-primary"
	id={`game-card-${game.key}`}
>
	<div class="flex justify-between">
		<div class="flex">
			<div class="flex gap-1.5">
				<Badge variant="secondary">
					{EventTitles[game.event_name] ?? game.event_name}
				</Badge>
				<Badge variant="secondary" style="background-color: {player?.color ?? 'gray'}">
					{player?.username ?? game.player_nickname}
				</Badge>
				<Badge variant={moveTypeStyles.variant}>
					{moveTypeStyles.text}
				</Badge>
				<Tooltip>
					<TooltipTrigger>
						<Badge variant="secondary" class="h-full">
							Играл {categoryDuration}
						</Badge>
					</TooltipTrigger>
					<TooltipContent>Примерное время по категории стрима</TooltipContent>
				</Tooltip>
			</div>
		</div>
		{#if game.date}
			<div
				class="absolute top-3 right-3 text-sm leading-[17px] font-semibold text-muted-foreground group-data-[current=true]:text-foreground"
			>
				{game.date}
			</div>
		{/if}
	</div>

	<div class="mt-3 flex gap-3">
		<ImageLoader
			src={game.game_cover || ''}
			alt={game.game_title || ''}
			class="h-[140px] w-[105px]"
		/>
		<div class="w-full space-y-3">
			<div class="text-2xl leading-[29px] font-bold" in:fade>{game.game_title}</div>
			<div class="font-medium text-muted-foreground [&>*]:inline" in:fade>
				<span>{game.rating} — </span>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html parsedReview}
			</div>
		</div>
	</div>

	{#if matchedGames.length > 0}
		<div class="mt-3 flex items-center justify-end gap-3">
			Также играли:
			<div>
				{#each matchedGames as game (game.key)}
					<PopoverGameCard {game} />
				{/each}
			</div>
		</div>
	{/if}
</div>
