<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navigation from '$lib/components/Navigation.svelte';
	import { TooltipProvider } from '$lib/components/ui/tooltip';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import Footer from '$lib/components/Footer.svelte';
	import { setAppManagerContext } from '$lib/contexts/appManagerContext';
	import { AppManager } from '$lib/stores/AppManager.svelte';

	let { children } = $props();

	const appManager = new AppManager();

	setAppManagerContext(appManager);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<TooltipProvider disableHoverableContent delayDuration={300}>
	<ScrollArea class="h-screen px-2.5" type="always">
		<div class="py-2.5">
			<Navigation />
			{@render children?.()}
			<Footer />
		</div>
	</ScrollArea>
</TooltipProvider>
