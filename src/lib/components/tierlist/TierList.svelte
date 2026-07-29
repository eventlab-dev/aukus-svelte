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
</script>

<div>
   {#each Object.entries(gamesPerTier) as [tier, games] (tier)}
        {@const isFirst = tier === 'S'}
        <div class="flex border-1 border-black {isFirst ? '' : 'border-t-0'}">
            <div class="h-[80px] w-[101px] border-r-1 border-black flex items-center justify-center bg-[{TIER_COLORS[tier as Tier]}]">
                {tier}
            </div>
            <div class=" bg-[#1A1A17] w-[700px]">
                {#each games as game (game.id)}
                    <div>
                        <img class="h-[80px] w-auto border-r-1 border-black" src={game.cover_image_url} alt={game.item_title} />
                    </div>
                {/each}
            </div>
        </div>
   {/each}
</div>