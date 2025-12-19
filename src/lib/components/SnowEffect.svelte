<script lang="ts">
	import { browser } from '$app/environment'
	import { snowStore, getFlakesCount } from '$lib/stores/SnowStore.svelte'

	const flakesCount = $derived(getFlakesCount(snowStore.value))
</script>

{#if browser && snowStore.value !== 'off'}
	<snow-effect color="white" flakes={flakesCount} speed={1}></snow-effect>
{/if}
