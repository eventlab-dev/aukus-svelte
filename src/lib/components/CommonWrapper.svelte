<script lang="ts">
	import { flip } from 'svelte/animate'
	import Footer from './Footer.svelte'
	import Navigation from './Navigation.svelte'
	import PlayerCard from './player/PlayerCard.svelte'
	import QuickMenu from './quickMenu/QuickMenu.svelte'
	import { ScrollArea } from './ui/scroll-area'
	import { createAppManager } from '$lib/stores/AppManager.svelte'
	import { setAppManagerContext } from '$lib/contexts/appManagerContext'

	let { children } = $props()

	const appManager = createAppManager()
	setAppManagerContext(appManager)

	const { players } = appManager

	const sortedPlayers = $derived([...$players].sort((a, b) => b.map_position - a.map_position))
</script>

<ScrollArea class="h-screen px-3" type="always">
	<div class="py-3">
		<div class="absolute top-3 left-3 z-10">
			<QuickMenu />
		</div>

		<div class="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
			{#each sortedPlayers as player (player.slug)}
				<div animate:flip={{ duration: 300 }}>
					<PlayerCard {player} />
				</div>
			{/each}
		</div>

		<Navigation />
		{@render children?.()}
		<Footer />
	</div>
</ScrollArea>
