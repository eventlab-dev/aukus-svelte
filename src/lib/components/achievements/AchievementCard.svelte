<script lang="ts">
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { AchievementItem } from '$lib/heyapi/aukus/types.gen'
	import { getSkinIconUrl } from '$lib/utils'
	import SkinPreview from '$lib/components/skinEditor/SkinPreview.svelte'
	import { scale } from 'svelte/transition'

	type Props = { achievement: AchievementItem }

	const { achievement }: Props = $props()

	const { eventDataStore, players, playersBySlug } = getAppManagerContext()

	const skin = $derived(eventDataStore.skinsById.get(achievement.reward_skin_id))

	const playersWithAchievement = $derived(
		players.filter((player) => player.unlocked_achievements.find((a) => a.id === achievement.id))
	)

	const playersWithFirstAchievement = $derived(
		players.filter((player) =>
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
					<div class="flex h-[80px] justify-center p-2">
						{#if achievement.visibility === 'hidden'}
							<img
								src={getSkinIconUrl(skin.image_url)}
								alt={skin.slot}
								class="h-[80px] w-auto rounded-sm"
							/>
						{:else}
							<SkinPreview {skin} />
						{/if}
					</div>

					<div class="mt-3 text-left text-sm leading-4 font-semibold text-muted-foreground">
						{#if achievement.visibility === 'hidden'}
							Откроется когда кто-либо из игроков получит это достижение
						{:else}
							{achievement.description}
							{#if achievement.points === 0}
								<div class="mt-3 underline">Не дает очков!</div>
							{/if}
						{/if}
					</div>
				</div>
				<div>
					<p class="text-right text-xs font-medium text-muted-foreground">
						Получили {playersWithAchievement.length}/{players.length}
					</p>
				</div>
			</div>
		</TooltipTrigger>
		<TooltipContent side="bottom" align="start" class="flex flex-col gap-1.5">
			{#each playersWithAchievement as player (player.slug)}
				{#if playersWithFirstAchievement.find((p) => p.slug === player.slug)}
					<div class="text-[#FF881E]">{playersBySlug.get(player.slug)?.username} - первый</div>
				{:else}
					<div>{playersBySlug.get(player.slug)?.username}</div>
				{/if}
			{/each}

			<div class="mt-3"></div>
			{#each players as player (player.slug)}
				{#if !playersWithAchievement.find((p) => p.slug === player.slug)}
					<div class="text-muted-foreground">{playersBySlug.get(player.slug)?.username}</div>
				{/if}
			{/each}
		</TooltipContent>
	</Tooltip>
{/if}
