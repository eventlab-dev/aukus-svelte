<script lang="ts">
	import { TIERS, type Tier } from '$lib/constants'
	import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import { scoreToTier } from '$lib/utils'
	import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
	import GamePopup from './GamePopup.svelte'

	type Props = {
		games: PlayerMoveItem[]
	}

	type GameWithTier = PlayerMoveItem & { tier: Tier }

	let { games }: Props = $props()

	const imageErrors = $state<Record<string, boolean>>({})

	const tiersList = TIERS.map((tier) => tier.rank).toReversed()

	const gamesWithTier: GameWithTier[] = $derived(
		games.map((game) => ({
			...game,
			tier: scoreToTier(game.item_rating)
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
			result[tier].sort((a, b) => b.item_rating - a.item_rating)
		}

		return result
	})
</script>

<div>
	{#each tiersList as tier, idx (tier)}
		{@const isFirst = idx === 0}
		{@const tierObj = TIERS.find((t) => t.rank === tier)}
		{@const games = gamesPerTier[tier] ?? []}
		<div class="flex border-1 border-black {isFirst ? '' : 'border-t-0'}">
			<div
				class="flex h-auto min-h-[80px] w-[101px] items-center justify-center border-r-1 border-black text-background"
				style="background-color: {tierObj?.color}"
			>
				{tierObj?.label}
			</div>
			<div class="flex w-[700px] flex-wrap gap-[1px] bg-[#1A1A17]">
				{#each games as game (game.id)}
					<Tooltip>
						<TooltipTrigger>
							<div class="">
								{#if game.cover_image_url && !imageErrors[game.id] && !game.cover_image_url.toLowerCase().includes('gamefallbackposter')}
									<img
										class="h-[80px] w-auto"
										src={game.cover_image_url}
										alt={game.item_title}
										onerror={() => (imageErrors[game.id] = true)}
									/>
								{:else}
									<div
										class="flex h-[80px] w-auto max-w-[80px] items-center justify-center bg-gray-800 text-center"
									>
										<span class="text-xs break-words text-white">{game.item_title}</span>
									</div>
								{/if}
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<GamePopup {game} />
						</TooltipContent>
					</Tooltip>
				{/each}
			</div>
		</div>
	{/each}
</div>
