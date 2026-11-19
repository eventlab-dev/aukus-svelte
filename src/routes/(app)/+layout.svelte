<script lang="ts">
	import { TooltipProvider } from '$lib/components/ui/tooltip'
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import CommonWrapper from '$lib/components/CommonWrapper.svelte'
	import { queryClient } from '$lib/client'
	import { onMount } from 'svelte'
	import { fetchFrontVersion } from '$lib/api/version'
	import { createUserActivityStore } from '$lib/stores/UserActivityStore.svelte'
	import { ScrollArea } from '$lib/components/ui/scroll-area'

	// Всё, что делает сайт сайтом: оболочка с навигацией и скроллом, провайдеры,
	// проверка версии фронта. Маршруты вне группы `(app)` (мини-игры) этого не
	// наследуют — им нужен весь viewport под канвас.
	let { children } = $props()

	onMount(() => {
		const userActivityStore = createUserActivityStore()

		const checkVersion = async () => {
			try {
				const data = await fetchFrontVersion()
				const currentVersion = import.meta.env.PACKAGE_VERSION
				const isStreamsPage = window.location.pathname === '/streams'
				if (
					data.version &&
					data.version !== currentVersion &&
					userActivityStore.isInactive &&
					!isStreamsPage
				) {
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
			<ScrollArea class="h-screen" type="auto" id="main-scroll-area">
				{@render children?.()}
			</ScrollArea>
		</CommonWrapper>
	</TooltipProvider>
</QueryClientProvider>
