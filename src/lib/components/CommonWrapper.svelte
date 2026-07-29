<script lang="ts">
	import Footer from './Footer.svelte'
	import Navigation from './Navigation.svelte'
	import QuickMenu from './quickMenu/QuickMenu.svelte'
	import { AppManager, setAppManager } from '$lib/stores/AppManager.svelte'
	import { onMount } from 'svelte'
	import PlayersList from './player/PlayersList.svelte'
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
		{#if !hidePanels}
			<div class="absolute top-3 left-3 z-10">
				<QuickMenu />
			</div>

			<div class="absolute top-3 right-3 z-10 flex hidden flex-col gap-1.5">
				<PlayersList />
			</div>

			<Navigation />
		{/if}
		{@render children?.()}
		{#if !hidePanels}
			<div class="px-3">
				<Footer />
			</div>
			
		{/if}
		<SmartphoneNav />
	</div>
{/if}

<Metrika />
<SnowEffect />
{#if !hidePanels}
	<FrontVersionInfo />
{/if}
