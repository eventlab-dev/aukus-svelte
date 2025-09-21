<script lang="ts">
	import '../app.css'

	import { TooltipProvider } from '$lib/components/ui/tooltip'
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import CommonWrapper from '$lib/components/CommonWrapper.svelte'
	import { queryClient } from '$lib/client'

	let { children } = $props()
</script>

<QueryClientProvider client={queryClient}>
	<TooltipProvider disableHoverableContent delayDuration={300}>
		<CommonWrapper>
			{@render children?.()}
		</CommonWrapper>
	</TooltipProvider>
</QueryClientProvider>
