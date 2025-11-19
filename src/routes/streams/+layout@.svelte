<script lang="ts">
	import './streams.css'
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import { queryClient } from '$lib/client'
	import { createAppManager } from '$lib/stores/AppManager.svelte'
	import { setAppManagerContext } from '$lib/contexts/appManagerContext'
	import { setErrorCallback } from '$lib/client'
	import { initializeClientInterceptors } from '$lib/clientInterceptors'

	let { children } = $props()

	const appManager = createAppManager()
	setAppManagerContext(appManager)

	initializeClientInterceptors()

	setErrorCallback((path, statusCode, message) => {
		appManager.errorNotificationStore.addError(path, statusCode, message)
	})
</script>

<svelte:head>
	<style>
		* {
			box-sizing: border-box;
		}
		
		html, body {
			margin: 0 !important;
			padding: 0 !important;
			overflow: hidden !important;
			width: 100% !important;
			height: 100% !important;
		}

		body > div {
			width: 100% !important;
			height: 100% !important;
			display: block !important;
		}

		#wallpaper,
		nav,
		footer,
		[class*="scroll-area"] {
			display: none !important;
		}
	</style>
</svelte:head>

<QueryClientProvider client={queryClient}>
	{@render children?.()}
</QueryClientProvider>

