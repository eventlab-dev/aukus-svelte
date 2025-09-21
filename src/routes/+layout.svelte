<script lang="ts">
	import '../app.css'

	import { TooltipProvider } from '$lib/components/ui/tooltip'
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
	import CommonWrapper from '$lib/components/CommonWrapper.svelte'

	let { children } = $props()
	const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
	<TooltipProvider disableHoverableContent delayDuration={300}>
		<CommonWrapper>
			{@render children?.()}
		</CommonWrapper>
	</TooltipProvider>
</QueryClientProvider>
