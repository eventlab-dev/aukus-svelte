<script>
	import MainPage from "$lib/components/pages/MainPage.svelte"
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { page } from '$app/stores'

	const app = getAppManager()
	const { navStore } = app

	// Watch for page changes and sync nav store
	$effect(() => {
		// Access $page.url.pathname to create a reactive dependency
		void $page.url.pathname
		navStore.sync()
	})
</script>

<MainPage />
