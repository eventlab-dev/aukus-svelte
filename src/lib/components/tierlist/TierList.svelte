<script lang="ts">
	import { TIERS, type Tier } from "$lib/constants"
	import type { PlayerMoveItem } from "$lib/heyapi/aukus/types.gen"
	import { scoreToTier } from "$lib/utils"

    type Props = {
        games: PlayerMoveItem[]
    }

    type GameWithTier = PlayerMoveItem & {tier: Tier}

    let { games }: Props = $props()

    const tiersList = TIERS.map(tier => tier.rank).toReversed()

    const gamesWithTier: GameWithTier[] = $derived(games.map(game => ({
        ...game,
        tier: scoreToTier(game.item_rating)
    })))

    const gamesPerTier = $derived.by(() => {
        const result: Record<Tier['rank'], GameWithTier[]> = Object.fromEntries(
            tiersList.map(tier => [tier, [] as GameWithTier[]])
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
   {#each tiersList as tier (tier)}
        {@const isFirst = tier === 1}
        {@const tierObj = TIERS.find(t => t.rank === tier)}
        {@const games = gamesPerTier[tier] ?? []}
        <div class="flex border-1 border-black {isFirst ? '' : 'border-t-0'}">
            <div class="h-auto min-h-[80px] w-[101px] border-r-1 border-black flex items-center justify-center text-background" style="background-color: {tierObj?.color}">
                {tierObj?.label}
            </div>
            <div class="bg-[#1A1A17] flex flex-wrap w-[700px] gap-[1px]">
                {#each games as game (game.id)}
                    <div class="">
                        <img class="h-[80px] w-auto" src={game.cover_image_url} alt={game.item_title} />
                    </div>
                {/each}
            </div>
        </div>
   {/each}
</div>