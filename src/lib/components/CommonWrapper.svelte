<script lang="ts">
	import { AppManager, setAppManager } from '$lib/stores/AppManager.svelte'
	import MobilePage from './mobile/MobilePage.svelte'
	import ErrorNotifications from './ErrorNotifications.svelte'
	import { setErrorCallback } from '$lib/client'
	import { initializeClientInterceptors } from '$lib/clientInterceptors'
	import { page } from '$app/state'
	import FrontVersionInfo from '$lib/components/FrontVersionInfo.svelte'
	import Metrika from '$lib/components/Metrika.svelte'
	import SnowEffect from './SnowEffect.svelte'
	import SmartphoneNav from './SmartphoneNav.svelte'

	let { children } = $props()

	const appManager = new AppManager()
	setAppManager(appManager)

	initializeClientInterceptors()

	setErrorCallback((path, statusCode, message) => {
		appManager.errorNotificationStore.addError(path, statusCode, message)
	})

	const { errorNotificationStore } = appManager

	const hidePanels = $derived(page.url.pathname === '/presentation' || true)
</script>

<ErrorNotifications {errorNotificationStore} />

{#if appManager.isMobile}
	<MobilePage />
{:else}
	<div class="">
		{@render children?.()}
		<SmartphoneNav />
	</div>
{/if}

<Metrika />
<SnowEffect />
{#if !hidePanels}
	<FrontVersionInfo />
{/if}
