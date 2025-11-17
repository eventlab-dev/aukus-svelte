<script lang="ts">
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte'
	import MobileMap from './MobileMap.svelte'
	import MobileMenu from './MobileMenu.svelte'
	import MobileRules from './MobileRules.svelte'
	import type { MobilePage } from './types'

	let page = $state<MobilePage>('map')
</script>

<ScrollArea class="h-screen" type="always">
	<MobileMenu bind:page />

	<div class="p-2">
		{#if page === 'map'}
			<div class="mt-6">
				<MobileMap />
			</div>
		{:else if page === 'table'}
			Mobile Table
		{:else if page === 'rules'}
			<MobileRules />
		{:else if page === 'player'}
			Mobile Player
		{:else if page === 'about'}
			About
		{/if}
	</div>
</ScrollArea>
