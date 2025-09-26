<script lang="ts">
	import { Toggle } from '$lib/components/ui/toggle'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { flip } from 'svelte/animate'
	import AchievementCard from './components/AchievementCard.svelte'
	import { sineInOut } from 'svelte/easing'
	import { fade } from 'svelte/transition'
	import X from '@lucide/svelte/icons/x'

	const { usersStore, eventDataStore } = getAppManagerContext()

	const { users } = usersStore
	const { achievements } = eventDataStore

	let selectedPlayerSlug: string | null = $state(null)

	function setPressed(_: boolean, slug: string) {
		if (selectedPlayerSlug === slug) {
			selectedPlayerSlug = null
		} else {
			selectedPlayerSlug = slug
		}
	}

	function getPressed(slug: string) {
		return selectedPlayerSlug === slug
	}
</script>

<div class="mx-auto mt-[100px] w-[804px] space-y-[50px]" in:fade>
	<h2 class="text-center text-5xl leading-[58px] font-bold">Все достижения</h2>
	<div class="space-y-5">
		<div class="flex w-full flex-wrap gap-2">
			{#each $users as player (player.slug)}
				<Toggle bind:pressed={() => getPressed(player.slug), (v) => setPressed(v, player.slug)}>
					{player.username}
					{#if selectedPlayerSlug === player.slug}
						<span class="rounded bg-white/20 p-0.5">
							<X class="stroke-4" />
						</span>
					{/if}
				</Toggle>
			{/each}
		</div>
		<div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
			{#each $achievements as achievement (achievement.id)}
				<div animate:flip={{ duration: 300, easing: sineInOut }}>
					<AchievementCard {achievement} />
				</div>
			{/each}
		</div>
	</div>
</div>
