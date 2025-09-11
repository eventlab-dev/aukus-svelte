<script lang="ts">
	import ImageLoader from '$lib/components/ImageLoader.svelte';
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';
	import { scale } from 'svelte/transition';

	type Props = {
		name: string;
		image: string;
		description: string;
		reward: string;
	};

	const { name, image, description, reward }: Props = $props();

	const { playersStore } = getAppManagerContext();

	const playersWithAchievement = 2;
</script>

<div
	class="h-fit space-y-2 rounded-lg bg-card p-2"
	transition:scale={{ duration: 200, start: 0.9, opacity: 0 }}
>
	<div class="flex">
		<h3 class="w-full text-xl leading-6 font-semibold">{name}</h3>
		<span class="text-xs font-medium text-muted-foreground">
			{playersWithAchievement}/{playersStore.totalPlayers}
		</span>
	</div>
	<ImageLoader src={image} alt={name} class="h-[60px] w-full rounded-sm" />
	<p class="text-sm leading-4 font-semibold text-muted-foreground">
		{description}
		<br />
		<br />
		Награда: {reward}
	</p>
</div>
