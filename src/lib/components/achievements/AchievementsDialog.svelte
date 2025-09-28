<script lang="ts">
	import { Toggle } from '$lib/components/ui/toggle'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { flip } from 'svelte/animate'
	import AchievementCard from './AchievementCard.svelte'
	import { sineInOut } from 'svelte/easing'
	import X from '@lucide/svelte/icons/x'
	import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
	import CrownIcon from '../icons/CrownIcon.svelte'
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte'

	const { eventDataStore, players, myPlayer } = getAppManagerContext()

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

	function handleOpenChange(open: boolean) {
		if (open && $myPlayer) {
			if (!selectedPlayerSlug) {
				selectedPlayerSlug = $myPlayer.slug
			}
		}
	}
</script>

<Dialog onOpenChange={handleOpenChange}>
	<DialogTrigger>
		<CrownIcon /> Достижения
	</DialogTrigger>
	<DialogContent class="text-primary-foreground selection:bg-foreground selection:text-background">
		<DialogHeader class="gap-3">
			<DialogTitle class="text-2xl font-bold">Достижения</DialogTitle>
		</DialogHeader>

		<div class="space-y-5">
			<div class="flex w-full flex-wrap gap-2">
				{#each $players as player (player.slug)}
					<Toggle
						variant="outline"
						bind:pressed={() => getPressed(player.slug), (v) => setPressed(v, player.slug)}
						class="cursor-pointer"
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
				<ScrollArea class="h-[70vh] w-fit" type="always">
					<div class="flex flex-wrap justify-center gap-3">
						{#each $achievements as achievement (achievement.id)}
							<div animate:flip={{ duration: 300, easing: sineInOut }}>
								<AchievementCard {achievement} />
							</div>
						{/each}
					</div>
				</ScrollArea>
			</div>
		</div>
	</DialogContent>
</Dialog>
