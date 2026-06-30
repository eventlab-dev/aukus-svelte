<script lang="ts">
	import { Button } from './ui/button'
	import { ScrollArea } from './ui/scroll-area'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import type { Snippet } from 'svelte'
	import { PAGE_BG, PAGE_SCROLL_ID } from '$lib/constants'

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

<div class="fixed w-full h-screen top-0 z-20 flex items-center justify-center bg-black/90 overflow-auto" style="background-image: url('{PAGE_BG}'); background-size: cover;">
	<ScrollArea class="h-full w-full" id={PAGE_SCROLL_ID}>
		{@render children?.()}
		{#if bottomSpace}
			<div class="h-60"></div>
		{/if}
	</ScrollArea>
	<div class="absolute top-2 left-2">
		<Button class="h-[34px] w-[178px] rounded-[18px]" onclick={closePage}>{'<-'} ЗАКРЫТЬ</Button>
	</div>
</div>

