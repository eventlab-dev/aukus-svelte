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
	import { page } from '$app/state'
	import { goto } from '$app/navigation'

	let pageState = $state<MobilePage>('map')
	let selectedPlayerSlug = $state<string | null>(null)

	const { playersBySlug } = getAppManagerContext()

	const selectedPlayer = $derived.by(() => {
		if (!selectedPlayerSlug) return null
		return playersBySlug.get(selectedPlayerSlug) || null
	})

	function navigateToPlayer(slug: string) {
		selectedPlayerSlug = slug
		pageState = 'player'
		goto(`/players/${slug}`, { noScroll: true, replaceState: false })
	}

	function handleBackToMenu() {
		pageState = 'map'
		selectedPlayerSlug = null
		goto('/', { noScroll: true, replaceState: false })
	}

	// React to route changes
	$effect(() => {
		const pathname = page.url.pathname
		const playerMatch = pathname.match(/^\/players\/([^/]+)$/)
		
		if (playerMatch) {
			const slug = playerMatch[1]
			if (playersBySlug.get(slug)) {
				selectedPlayerSlug = slug
				pageState = 'player'
			} else {
				pageState = 'map'
				selectedPlayerSlug = null
			}
		} else if (pathname === '/') {
			pageState = 'map'
			selectedPlayerSlug = null
		}
	})
</script>

<ScrollArea class="h-screen" type="always">
	{#if pageState === 'player' && selectedPlayer}
		<div class="sticky top-2 z-1000 flex gap-2 p-2">
			<Button class="rounded-xl" variant="secondary" onclick={handleBackToMenu}>← Назад</Button>
		</div>
	{:else}
		<MobileMenu bind:page={pageState} />
	{/if}

	<div class="mb-30 p-2">
		{#if pageState === 'map'}
			<div class="mt-6">
				<MobileMap {navigateToPlayer} />
			</div>
		{:else if pageState === 'table'}
			<MobileLeaderboard {navigateToPlayer} />
		{:else if pageState === 'rules'}
			<MobileRules />
		{:else if pageState === 'player' && selectedPlayerSlug}
			<MobilePlayer playerSlug={selectedPlayerSlug} />
		{:else if pageState === 'about'}
			<MobileAbout />
		{/if}
	</div>
</ScrollArea>
