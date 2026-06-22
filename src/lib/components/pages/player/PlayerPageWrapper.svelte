<script lang="ts">
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import NotFoundPage from '../NotFoundPage.svelte'
	import PlayerPage from './PlayerPage.svelte'

	const app = getAppManager()
	const { navStore } = app

	const playerSlug = $derived(
		navStore.dynamicPage ? app.playersBySlug.get(navStore.dynamicPage)?.slug : undefined
	)
</script>

{#if playerSlug}
	<PlayerPage {playerSlug} />
{:else}
	<NotFoundPage />
{/if}
