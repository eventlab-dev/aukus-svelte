<script lang="ts">
	import { Toggle } from '$lib/components/ui/toggle'
	import { flip } from 'svelte/animate'
	import AchievementCard from './AchievementCard.svelte'
	import { sineInOut } from 'svelte/easing'
	import X from '@lucide/svelte/icons/x'
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
	import CrownIcon from '../icons/CrownIcon.svelte'
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
	const { eventDataStore } = app


	let selectedPlayerSlug: string | null = $state(null)

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

	function handleOpenChange(open: boolean) {
		if (open && app.myPlayer) {
			if (!selectedPlayerSlug) {
				selectedPlayerSlug = app.myPlayer.slug
			}
		}
		if (!open) {
			app.navStore.closePage()
		}
	}
</script>

<Dialog onOpenChange={handleOpenChange} open>
	<DialogTrigger>
		<CrownIcon /> Достижения
	</DialogTrigger>
	<DialogContent
		class="max-w-[840px]! text-primary-foreground selection:bg-foreground selection:text-background"
	>
		<DialogHeader class="gap-3">
			<DialogTitle class="text-2xl font-bold">Достижения</DialogTitle>
		</DialogHeader>

		<div class="space-y-5">
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

			<div class="flex justify-center">
				<ScrollArea class="h-[70vh] w-fit">
					<div class="flex flex-wrap items-stretch gap-3">
						{#each filteredAchievements as achievement (achievement.id)}
							<div animate:flip={{ duration: 300, easing: sineInOut }} class="flex flex-col">
								<AchievementCard {achievement} />
							</div>
						{/each}
					</div>
					<div class="mt-10"></div>
				</ScrollArea>
			</div>
		</div>
	</DialogContent>
</Dialog>
