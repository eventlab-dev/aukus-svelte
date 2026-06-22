<script lang="ts">
	import { Button } from './ui/button'
	import { ScrollArea } from './ui/scroll-area'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import type { Snippet } from 'svelte'

	type Props = {
		bottomSpace?: boolean
		children?: Snippet
	}

	let { bottomSpace = true, children }: Props = $props()

	const app = getAppManager()
	const {navStore} = app
	
	function closePage() {
		navStore.closePage()
	}
</script>

<div class="fixed w-full h-screen top-0 z-20 flex items-center justify-center bg-black/90 overflow-auto">
	<ScrollArea class="h-full w-full">
		{@render children?.()}
		{#if bottomSpace}
			<div class="h-60"></div>
		{/if}
	</ScrollArea>
	<div class="absolute top-4 right-5 ">
		<Button class="w-50 h-20" onclick={closePage}>Close</Button>
	</div>
</div>

