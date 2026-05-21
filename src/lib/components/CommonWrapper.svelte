<script lang="ts">
	// @ts-expect-error types not found
	import { TWallpaper } from 'twallpaper'
	import 'twallpaper/css'
	import Footer from './Footer.svelte'
	import Navigation from './Navigation.svelte'
	import QuickMenu from './quickMenu/QuickMenu.svelte'
	import { ScrollArea } from './ui/scroll-area'
	import { createAppManager } from '$lib/stores/AppManager.svelte'
	import { setAppManagerContext } from '$lib/contexts/appManagerContext'
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

	let { children } = $props()

	const appManager = createAppManager()
	setAppManagerContext(appManager)

	initializeClientInterceptors()

	setErrorCallback((path, statusCode, message) => {
		appManager.errorNotificationStore.addError(path, statusCode, message)
	})

	onMount(() => {
		const container = document.getElementById('wallpaper') as HTMLElement
		if (!container) return

		const wallpaper = new TWallpaper(container, {
			fps: 30,
			tails: 40,
			animate: true,
			scrollAnimate: false,
			colors: ['#4a2020', '#204a20', '#4a4a20', '#203040'],
			pattern: {
				image: 'https://twallpaper.js.org/patterns/christmas.svg',
				background: '#0a0a0a',
				blur: 0,
				size: '470px',
				opacity: 1,
				mask: true
			}
		})
		wallpaper.init()
	})

	const { isMobile, errorNotificationStore } = appManager

	const hidePanels = $derived(page.url.pathname === '/presentation')
</script>

<ErrorNotifications {errorNotificationStore} />

{#if $isMobile}
	<MobilePage />
{:else}
	<ScrollArea class="h-screen" type="always" id="main-scroll-area">
		<div id="wallpaper"></div>
		<div class="py-3">
			{#if !hidePanels}
				<div class="absolute top-3 left-3 z-10">
					<QuickMenu />
				</div>

				<div class="hidden absolute top-3 right-3 z-10 flex flex-col gap-1.5">
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
		</div>
	</ScrollArea>
{/if}

<Metrika />
<SnowEffect />
{#if !hidePanels}
	<FrontVersionInfo />
{/if}
