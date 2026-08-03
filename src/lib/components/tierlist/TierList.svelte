<script lang="ts">
	import { TIERS, type Tier } from '$lib/constants'
	import type { CommonGameItem } from '$lib/types'
	import { scoreToTier } from '$lib/utils'
	import GamePopupContent from '../gameCard/GamePopupContent.svelte'
	import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
	
	type Props = {
		games: CommonGameItem[]
	}

	type GameWithTier = CommonGameItem & { tier: Tier }

	let { games }: Props = $props()

	const imageErrors = $state<Record<string, boolean>>({})

	const tiersList = TIERS.map((tier) => tier.rank).toReversed()

	const gamesWithTier: GameWithTier[] = $derived(
		games.map((game) => ({
			...game,
			tier: scoreToTier(game.rating_num)
		}))
	)

	const gamesPerTier = $derived.by(() => {
		const result: Record<Tier['rank'], GameWithTier[]> = Object.fromEntries(
			tiersList.map((tier) => [tier, [] as GameWithTier[]])
		) as Record<Tier['rank'], GameWithTier[]>

		for (const game of gamesWithTier) {
			result[game.tier.rank].push(game)
		}

		for (const tier of tiersList) {
			result[tier].sort((a, b) => (b.rating_num ?? 0) - (a.rating_num ?? 0))
		}

		return result
	})
</script>

<div class="flex flex-col gap-[1px] overflow-hidden rounded-xl bg-primary">
	{#each tiersList as tier (tier)}
		{@const tierObj = TIERS.find((t) => t.rank === tier)}
		{@const games = gamesPerTier[tier] ?? []}
		{@const hideTier = tierObj?.rank === 0 && games.length === 0}
		{#if !hideTier}
			<div class="flex gap-[1px]">
				<div
					class="flex h-auto min-h-[80px] w-[50px] items-center justify-center text-background"
					style="background-color: {tierObj?.color}"
				>
					{tierObj?.label}
				</div>
				<div class="flex w-[750px] flex-wrap gap-[1px]">
					{#each games as game (game.key)}
						<Tooltip>
							<TooltipTrigger>
								<div class="">
									{#if game.game_cover && !imageErrors[game.key] && !game.game_cover
											.toLowerCase()
											.includes('gamefallbackposter')}
										<img
											class="h-[80px] w-auto"
											src={game.game_cover}
											alt={game.game_title}
											onerror={() => (imageErrors[game.key] = true)}
										/>
									{:else}
										<div
											class="flex h-[80px] w-auto max-w-[80px] items-center justify-center bg-gray-800 text-center"
										>
											<span class="text-xs break-words text-white">{game.game_title}</span>
										</div>
									{/if}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<GamePopupContent {game} />
							</TooltipContent>
						</Tooltip>
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>
