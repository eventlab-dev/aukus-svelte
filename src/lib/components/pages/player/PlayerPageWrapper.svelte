<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import NotFoundPage from '../NotFoundPage.svelte'
	import PlayerPage from './PlayerPage.svelte'

	const { navStore, playersBySlug } = getAppManagerContext()

	const playerSlug = $derived(
		navStore.dynamicPage ? playersBySlug.get(navStore.dynamicPage)?.slug : undefined
	)
</script>

{#if playerSlug}
	<PlayerPage {playerSlug} />
{:else}
	<NotFoundPage />
{/if}
