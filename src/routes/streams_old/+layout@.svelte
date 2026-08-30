<script lang="ts">
	import './streams.css'
	import { QueryClientProvider } from '@tanstack/svelte-query'
	import { queryClient, setErrorCallback } from '$lib/client'
	import { setAppManager, AppManager } from '$lib/stores/AppManager.svelte'
	import {
		initializeClientInterceptors,
		setTokenInvalidatedCallback
	} from '$lib/clientInterceptors'

	let { children } = $props()

	const appManager = new AppManager()
	setAppManager(appManager)

	initializeClientInterceptors()

	setTokenInvalidatedCallback(() => {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('auth_token')
		}
		appManager.usersStore.accessToken = null
		queryClient.clear()
	})

	setErrorCallback((path, statusCode, message) => {
		appManager.errorNotificationStore.addError(path, statusCode, message)
	})
</script>

<svelte:head>
	<style>
		* {
			box-sizing: border-box;
		}

		html,
		body {
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
		[class*='scroll-area'] {
			display: none !important;
		}
	</style>
</svelte:head>

<QueryClientProvider client={queryClient}>
	{@render children?.()}
</QueryClientProvider>
