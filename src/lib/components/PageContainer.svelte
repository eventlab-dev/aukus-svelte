<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { Button } from './ui/button'

	const {navStore} = getAppManagerContext()
	
	function closePage() {
		navStore.closePage()
	}
</script>

<div class="fixed inset-0 z-100 flex items-center justify-center bg-black/90">
	<div class="absolute top-4 left-1/2 -translate-x-1/2">
		<Button class="w-50 h-20" onclick={closePage}>Close</Button>
	</div>
	<slot />
</div>
