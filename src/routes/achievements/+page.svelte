<script lang="ts">
	import type { Achievement } from '$lib/api/aukus/types';
	import { Toggle } from '$lib/components/ui/toggle';
	import { FALLBACK_GAME_POSTER } from '$lib/constants';
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';
	import { flip } from 'svelte/animate';
	import AchievementCard from './components/AchievementCard.svelte';
	import { sineInOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	const achievements: Achievement[] = Array.from({ length: 10 }, (_, idx) => ({
		name: `Достижение ${idx + 1}`,
		image: FALLBACK_GAME_POSTER,
		description: Array.from(
			{ length: 1 + Math.floor(Math.random() * 2) },
			(_, i) => `Описание достижения ${idx + 1} ${i + 1}`
		).join('\n'),
		reward: `Награда ${idx + 1}`,
		players_ids: Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => i + 1)
	}));

	const { playersStore } = getAppManagerContext();

	let selectedPlayerId: number | null = $state(null);

	const filteredAchievements = $derived.by(getFilteredAchievements);

	function getFilteredAchievements() {
		const filtered = achievements.filter((achievement) =>
			achievement.players_ids.some((id) => selectedPlayerId === id)
		);
		return selectedPlayerId === null ? achievements : filtered;
	}

	function setPressed(_: boolean, id: number) {
		if (selectedPlayerId === id) selectedPlayerId = null;
		else selectedPlayerId = id;
	}

	function getPressed(id: number) {
		return selectedPlayerId === id;
	}
</script>

<div class="mx-auto mt-[100px] w-[804px] space-y-[50px]" in:fade>
	<h2 class="text-center text-5xl leading-[58px] font-bold">Все достижения</h2>
	<div class="space-y-5">
		<div class="flex w-full flex-wrap gap-2">
			{#each playersStore.players as player}
				<Toggle
					variant="primary"
					bind:pressed={() => getPressed(player.id), (v) => setPressed(v, player.id)}
				>
					{player.name}
				</Toggle>
			{/each}
		</div>
		<div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
			{#each filteredAchievements as achievement (achievement.name)}
				<div animate:flip={{ duration: 300, easing: sineInOut }}>
					<AchievementCard {...achievement} />
				</div>
			{/each}
		</div>
	</div>
</div>
