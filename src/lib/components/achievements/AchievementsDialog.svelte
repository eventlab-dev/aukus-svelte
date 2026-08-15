<script lang="ts">
	import { flip } from 'svelte/animate'
	import AchievementCard from './AchievementCard.svelte'
	import { sineInOut } from 'svelte/easing'
	import CrownIcon from '../icons/CrownIcon.svelte'
	import { Button } from '../ui/button'
	import PageContainer from '../PageContainer.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { BG_NET } from '$lib/constants'
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
	import PlayerAvatar from '../player/PlayerAvatar.svelte'

	const app = getAppManager()
	const { eventDataStore } = app

	let selectedPlayerSlug: string = $state('all')

	// Initialize with current player when component mounts
	$effect(() => {
		if (app.myPlayer && !selectedPlayerSlug) {
			selectedPlayerSlug = app.myPlayer.slug
		}
	})

	const filteredAchievements = $derived.by(() => {
		if (selectedPlayerSlug === 'all') {
			return eventDataStore.achievements
		}
		const player = app.playersBySlug.get(selectedPlayerSlug)
		if (!player) {
			return eventDataStore.achievements
		}

		return eventDataStore.achievements.filter((a) =>
			player.unlocked_achievements.find((pa) => pa.id === a.id)
		)
	})
</script>

<Button href="/achievements">
	<CrownIcon /> Достижения
</Button>

<PageContainer
	class="bg-[#4D66B9]!"
	style={`background-image: url('${BG_NET}'); background-size: repeat;`}
>
	<div class="flex flex-col items-center gap-5 pt-16">
		<div class="w-full max-w-[840px]">
			<h1 class="mb-5 text-center text-2xl font-bold">Достижения</h1>

			<Tabs
				value={selectedPlayerSlug}
				class="w-full"
				onValueChange={(value) => {
					selectedPlayerSlug = value
				}}
			>
				<TabsList class="flex w-full flex-wrap gap-2 bg-transparent">
					<TabsTrigger value="all" class="uppercase">Все</TabsTrigger>
					{#each app.players as player (player.slug)}
						<TabsTrigger value={player.slug} class="flex items-center gap-2 uppercase">
							<PlayerAvatar
								src={player.avatar_link ?? ''}
								name={player.username}
								isOnline={Boolean(player.is_online)}
								size="small"
							/>
							{player.username}
						</TabsTrigger>
					{/each}
				</TabsList>
			</Tabs>

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
