<script lang="ts">
	import { Button } from './ui/button'
	import { ScrollArea } from './ui/scroll-area'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
	const {navStore} = app
	
	function closePage() {
		navStore.closePage()
	}
</script>

<div class="fixed w-full h-screen top-0 z-20 flex items-center justify-center bg-black/90 overflow-auto">
	<ScrollArea class="h-full w-full">
		<slot />
		<div class="h-60"></div>
	</ScrollArea>
	<div class="absolute top-4 right-5 ">
		<Button class="w-50 h-20" onclick={closePage}>Close</Button>
	</div>
</div>

