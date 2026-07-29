<script lang="ts">
	import { TIER_COLORS, type Tier } from "$lib/constants"
	import type { PlayerMoveItem } from "$lib/heyapi/aukus/types.gen"
	import { scoreToTier } from "$lib/utils"

    type Props = {
        games: PlayerMoveItem[]
    }

    type GameWithTier = PlayerMoveItem & {tier: Tier}

    let { games }: Props = $props()

    const gamesWithTier: GameWithTier[] = $derived(games.map(game => ({
        ...game,
        tier: scoreToTier(game.item_rating)
    })))

    const gamesPerTier = $derived.by(() => {
        const result: Record<Tier, GameWithTier[]> = {
            S: [],
            A: [],
            B: [],
            C: [],
            D: []
        }
        
        for (const game of gamesWithTier) {
            result[game.tier].push(game)
        }

        for (const tier of ['S', 'A', 'B', 'C', 'D'] as Tier[]) {
            result[tier].sort((a, b) => b.item_rating - a.item_rating)
        }
        
        return result
    })

    const TierText: Record<Tier, string> = {
        'S': '9+',
        'A': '7-9',
        'B': '5-7',
        'C': '2-5',
        'D': '0-2'
    }
</script>

<div>
   {#each Object.entries(gamesPerTier) as [tier, games] (tier)}
        {@const isFirst = tier === 'S'}
        <div class="flex border-1 border-black {isFirst ? '' : 'border-t-0'}">
            <div class="h-auto min-h-[80px] w-[101px] border-r-1 border-black flex items-center justify-center text-background" style="background-color: {TIER_COLORS[tier as Tier]}">
                {TierText[tier as Tier]}
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