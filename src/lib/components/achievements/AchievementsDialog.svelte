<script lang="ts">
	import { Toggle } from '$lib/components/ui/toggle'
	import { flip } from 'svelte/animate'
	import AchievementCard from './AchievementCard.svelte'
	import { sineInOut } from 'svelte/easing'
	import X from '@lucide/svelte/icons/x'
	import CrownIcon from '../icons/CrownIcon.svelte'
	import { Button } from '../ui/button'
	import PageContainer from '../PageContainer.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { BG_NET } from '$lib/constants'

	const app = getAppManager()
	const { eventDataStore } = app

	let selectedPlayerSlug: string | null = $state(null)

	// Initialize with current player when component mounts
	$effect(() => {
		if (app.myPlayer && !selectedPlayerSlug) {
			selectedPlayerSlug = app.myPlayer.slug
		}
	})

	const filteredAchievements = $derived.by(() => {
		if (!selectedPlayerSlug) return eventDataStore.achievements
		const player = app.playersBySlug.get(selectedPlayerSlug)
		if (!player) return eventDataStore.achievements

		return eventDataStore.achievements.filter((a) => player.unlocked_achievements.find((pa) => pa.id === a.id))
	})

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

<Button href="/achievements">
	<CrownIcon /> Достижения
</Button>

<PageContainer class="bg-[#4D66B9]!" style={`background-image: url('${BG_NET}'); background-size: repeat;`}>
	<div class="flex flex-col items-center gap-5 pt-16">
		<div class="w-full max-w-[840px]">
			<h1 class="mb-5 text-center text-2xl font-bold">Достижения</h1>
			
			<div class="flex w-full flex-wrap gap-2">
				{#each app.players as player (player.slug)}
					<Toggle
						variant="default"
						bind:pressed={() => getPressed(player.slug), (v) => setPressed(v, player.slug)}
						class="cursor-pointer data-[state=off]:bg-secondary data-[state=on]:bg-[var(--dynamic-color)]"
						style={`--dynamic-color: ${player.color}`}
					>
						{player.username}
						{#if selectedPlayerSlug === player.slug}
							<span class="rounded bg-white/20 p-0.5">
								<X class="stroke-4" />
							</span>
						{/if}
					</Toggle>
				{/each}
			</div>

			<div class="mt-5 flex justify-center">
				<div class="flex flex-wrap items-stretch gap-3">
					{#each filteredAchievements as achievement (achievement.id)}
						<div animate:flip={{ duration: 300, easing: sineInOut }} class="flex flex-col">
							<AchievementCard {achievement} />
						</div>
					{/each}
				</div>
				<div class="mt-10"></div>
			</div>
		</div>
	</div>
</PageContainer>
