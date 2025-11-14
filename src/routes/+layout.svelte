<script lang="ts">
	import '../app.css'

	import { TooltipProvider } from '$lib/components/ui/tooltip'
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import CommonWrapper from '$lib/components/CommonWrapper.svelte'
	import { queryClient } from '$lib/client'
	import { onMount } from 'svelte'
	import { fetchFrontVersion } from '$lib/api/version'
	import { createUserActivityStore } from '$lib/stores/UserActivityStore.svelte'
	import FrontVersionInfo from '$lib/components/FrontVersionInfo.svelte'

	let { children } = $props()

	const userActivityStore = createUserActivityStore()

	onMount(() => {
		const checkVersion = async () => {
			try {
				const data = await fetchFrontVersion()
				const currentVersion = import.meta.env.PACKAGE_VERSION
				if (data.version && data.version !== currentVersion && userActivityStore.isInactive) {
					console.log(
						`Version mismatch: current ${currentVersion}, server ${data.version}. User is inactive, reloading...`
					)
					window.location.href = window.location.pathname + '?reload=' + new Date().getTime()
				}
			} catch (error) {
				console.error('Failed to fetch version:', error)
			}
		}

		const interval = setInterval(checkVersion, 60000)

		return () => {
			clearInterval(interval)
			userActivityStore.cleanup()
		}
	})
</script>

<QueryClientProvider client={queryClient}>
	<TooltipProvider disableHoverableContent delayDuration={300}>
		<CommonWrapper>
			{@render children?.()}
		</CommonWrapper>
	</TooltipProvider>
</QueryClientProvider>

<FrontVersionInfo />
