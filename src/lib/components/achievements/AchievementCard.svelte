<script lang="ts">
	import ImageLoader from '$lib/components/ImageLoader.svelte'
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { AchievementItem } from '$lib/heyapi/aukus/types.gen'
	import { derived } from 'svelte/store'
	import { scale } from 'svelte/transition'

	type Props = { achievement: AchievementItem }

	const { achievement }: Props = $props()

	const { eventDataStore, usersStore } = getAppManagerContext()
	const { players, skinsById } = eventDataStore
	const { usersBySlug } = usersStore

	const skin = derived(skinsById, ($skinsById) => $skinsById.get(achievement.reward_skin_id))

	const playersWithAchievement = derived(players, ($players) => {
		return $players.filter((player) =>
			player.unlocked_achievements.find((a) => a.id === achievement.id)
		)
	})
</script>

<div
	class="h-fit space-y-2 rounded-lg bg-card p-2"
	transition:scale={{ duration: 200, start: 0.9, opacity: 0 }}
>
	<div class="flex">
		<Tooltip>
			<TooltipTrigger>
				<span class="text-xs font-medium text-muted-foreground">
					{$playersWithAchievement.length}/{$players.length}
				</span>
			</TooltipTrigger>
			<TooltipContent side="bottom" align="start" class="flex flex-col gap-1.5">
				{#each $playersWithAchievement as player (player.slug)}
					<div>{$usersBySlug.get(player.slug)?.username}</div>
				{/each}
			</TooltipContent>
		</Tooltip>
	</div>
	<ImageLoader src={$skin!.image_url} alt={$skin!.slot} class="h-[100px] w-auto rounded-sm" />
	<p class="text-sm leading-4 font-semibold text-muted-foreground">
		{achievement.description}
	</p>
</div>
