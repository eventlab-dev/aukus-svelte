<script lang="ts">
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { AchievementItem } from '$lib/heyapi/aukus/types.gen'
	import { getSkinIconUrl } from '$lib/utils'
	import { scale } from 'svelte/transition'

	type Props = { achievement: AchievementItem }

	const { achievement }: Props = $props()

	const { eventDataStore, players, playersBySlug } = getAppManagerContext()
	const { skinsById } = eventDataStore

	const skin = $derived($skinsById.get(achievement.reward_skin_id))

	const playersWithAchievement = $derived(
		$players.filter((player) => player.unlocked_achievements.find((a) => a.id === achievement.id))
	)

	const playersWithFirstAchievement = $derived(
		$players.filter((player) =>
			player.unlocked_achievements.find((a) => a.id === achievement.id && a.is_first)
		)
	)
</script>

{#if skin}
	<Tooltip>
		<TooltipTrigger class="h-full">
			<div
				class="flex h-full w-[150px] flex-col justify-between space-y-2 rounded-lg bg-secondary p-2"
				transition:scale={{ duration: 200, start: 0.9, opacity: 0 }}
			>
				<div>
					<div class="flex justify-center p-2">
						<img
							src={getSkinIconUrl(skin.image_url)}
							alt={skin.slot}
							class="h-[80px] w-auto rounded-sm"
						/>
					</div>
					<div class="mt-3 text-left text-sm leading-4 font-semibold text-muted-foreground">
						{#if achievement.visibility === 'hidden'}
							Откроется когда кто-либо из игроков получит это достижение
						{:else}
							{achievement.description}
						{/if}
					</div>
				</div>
				<div>
					<p class="text-right text-xs font-medium text-muted-foreground">
						Получили {playersWithAchievement.length}/{$players.length}
					</p>
				</div>
			</div>
		</TooltipTrigger>
		<TooltipContent side="bottom" align="start" class="flex flex-col gap-1.5">
			Получили:
			{#each playersWithAchievement as player (player.slug)}
				{#if playersWithFirstAchievement.find((p) => p.slug === player.slug)}
					<div class="text-[#FF881E]">{$playersBySlug[player.slug]?.username}</div>
				{:else}
					<div>{$playersBySlug[player.slug]?.username}</div>
				{/if}
			{/each}
		</TooltipContent>
	</Tooltip>
{/if}
