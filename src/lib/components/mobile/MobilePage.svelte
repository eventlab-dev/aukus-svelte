<script lang="ts">
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte'
	import MobileAbout from './MobileAbout.svelte'
	import MobileMap from './MobileMap.svelte'
	import MobileMenu from './MobileMenu.svelte'
	import MobileRules from './MobileRules.svelte'
	import MobileLeaderboard from './MobileLeaderboard.svelte'
	import MobilePlayer from './MobilePlayer.svelte'
	import type { MobilePage } from './types'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { Button } from '../ui/button'

	let page = $state<MobilePage>('map')
	let selectedPlayerSlug = $state<string | null>(null)

	const { playersBySlug } = getAppManagerContext()

	const selectedPlayer = $derived.by(() => {
		if (!selectedPlayerSlug) return null
		return $playersBySlug[selectedPlayerSlug] || null
	})

	function handlePlayerSelect(slug: string) {
		selectedPlayerSlug = slug
		page = 'player'
	}

	function handleBackToMenu() {
		page = 'map'
		selectedPlayerSlug = null
	}

	if (typeof window !== 'undefined') {
		;(window as any).navigateToPlayer = handlePlayerSelect
	}
</script>

<ScrollArea class="h-screen" type="always">
	{#if page === 'player' && selectedPlayer}
		<div class="sticky top-2 z-1000 flex gap-2 p-2">
			<Button class="rounded-xl" variant="secondary" onclick={handleBackToMenu}>← Назад</Button>
		</div>
	{:else}
		<MobileMenu bind:page />
	{/if}

	<div class="mb-30 p-2">
		{#if page === 'map'}
			<div class="mt-6">
				<MobileMap />
			</div>
		{:else if page === 'table'}
			<MobileLeaderboard />
		{:else if page === 'rules'}
			<MobileRules />
		{:else if page === 'player' && selectedPlayerSlug}
			<MobilePlayer playerSlug={selectedPlayerSlug} />
		{:else if page === 'about'}
			<MobileAbout />
		{/if}
	</div>
</ScrollArea>
