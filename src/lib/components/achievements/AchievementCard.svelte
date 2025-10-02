<script lang="ts">
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { AchievementItem } from '$lib/heyapi/aukus/types.gen'
	import { scale } from 'svelte/transition'

	type Props = { achievement: AchievementItem }

	const { achievement }: Props = $props()

	const { eventDataStore, players, playersBySlug } = getAppManagerContext()
	const { skinsById } = eventDataStore

	const skin = $derived($skinsById.get(achievement.reward_skin_id))

	const playersWithAchievement = $derived(
		$players.filter((player) => player.unlocked_achievements.find((a) => a.id === achievement.id))
	)
</script>

{#if skin}
	<Tooltip>
		<TooltipTrigger>
			<div
				class="w-[150px] space-y-2 rounded-lg bg-secondary p-2"
				transition:scale={{ duration: 200, start: 0.9, opacity: 0 }}
			>
				<div class="flex justify-center">
					<img src={skin.image_url} alt={skin.slot} class="h-[80px] w-auto rounded-sm" />
				</div>
				<div class="text-left text-sm leading-4 font-semibold text-muted-foreground">
					{achievement.description}
				</div>
				<div class="flex">
					<span class="text-xs font-medium text-muted-foreground">
						Получили {playersWithAchievement.length}/{$players.length}
					</span>
				</div>
			</div>
		</TooltipTrigger>
		<TooltipContent side="bottom" align="start" class="flex flex-col gap-1.5">
			{#each playersWithAchievement as player (player.slug)}
				<div>{$playersBySlug[player.slug]?.username}</div>
			{/each}
		</TooltipContent>
	</Tooltip>
{/if}
