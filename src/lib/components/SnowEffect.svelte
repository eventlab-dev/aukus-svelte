<script lang="ts">
	import { browser } from '$app/environment'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
	const { snowStore } = app
</script>

{#if browser && snowStore.snowState.value !== 'off'}
	<snow-effect color="white" flakes={snowStore.flakesCount} speed={1}></snow-effect>
{/if}
