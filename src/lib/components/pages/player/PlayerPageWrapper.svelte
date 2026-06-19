<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import NotFoundPage from '../NotFoundPage.svelte'
    import PlayerPage from './PlayerPage.svelte'

    const { navStore, playersBySlug } = getAppManagerContext()

    const player = $derived(navStore.dynamicPage && $playersBySlug[navStore.dynamicPage])
</script>

{#if player}
    <PlayerPage playerSlug={player.slug} />
{:else}
    <NotFoundPage />
{/if}
