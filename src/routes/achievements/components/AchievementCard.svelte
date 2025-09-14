<script lang="ts">
	import ImageLoader from '$lib/components/ImageLoader.svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';
	import { scale } from 'svelte/transition';
	import type { Achievement } from '$lib/api/aukus/types';

	type Props = Achievement & {};

	const { name, image, description, reward, players_ids }: Props = $props();

	const { playersStore } = getAppManagerContext();

	const playersWithAchievement = $derived(
		playersStore.players.filter((player) => players_ids.includes(player.id))
	);
</script>

<div
	class="h-fit space-y-2 rounded-lg bg-card p-2"
	transition:scale={{ duration: 200, start: 0.9, opacity: 0 }}
>
	<div class="flex">
		<h3 class="w-full text-xl leading-6 font-semibold">{name}</h3>
		<Tooltip>
			<TooltipTrigger>
				<span class="text-xs font-medium text-muted-foreground">
					{playersWithAchievement.length}/{playersStore.totalPlayers}
				</span>
			</TooltipTrigger>
			<TooltipContent side="bottom" align="start" class="flex flex-col gap-1.5">
				{#each playersWithAchievement as { name }}
					<div>{name}</div>
				{/each}
			</TooltipContent>
		</Tooltip>
	</div>
	<ImageLoader src={image} alt={name} class="h-[60px] w-full rounded-sm" />
	<p class="text-sm leading-4 font-semibold text-muted-foreground">
		{description}
		<br />
		<br />
		Награда: {reward}
	</p>
</div>
