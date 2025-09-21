<script lang="ts">
	import '../app.css'

	import Navigation from '$lib/components/Navigation.svelte'
	import { TooltipProvider } from '$lib/components/ui/tooltip'
	import { ScrollArea } from '$lib/components/ui/scroll-area'
	import Footer from '$lib/components/Footer.svelte'
	import { setAppManagerContext } from '$lib/contexts/appManagerContext'
	import { AppManager } from '$lib/stores/AppManager.svelte'
	import QuickMenu from '$lib/components/quickMenu/QuickMenu.svelte'
	import PlayerCard from '$lib/components/player/PlayerCard.svelte'
	import { flip } from 'svelte/animate'
	import { QueryClientProvider } from '@tanstack/svelte-query'

	let { children } = $props()

	const appManager = new AppManager()
	const { playersStore } = appManager

	setAppManagerContext(appManager)

	const sortedPlayers = $derived(
		playersStore.players.toSorted((a, b) => b.total_score - a.total_score)
	)
</script>

<QueryClientProvider client={appManager.queryClient}>
	<TooltipProvider disableHoverableContent delayDuration={300}>
		<ScrollArea class="h-screen px-3" type="always">
			<div class="py-3">
				<div class="absolute top-3 left-3 z-10">
					<QuickMenu />
				</div>

				<div class="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
					{#each sortedPlayers as player (player.id)}
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
	</TooltipProvider>
</QueryClientProvider>
