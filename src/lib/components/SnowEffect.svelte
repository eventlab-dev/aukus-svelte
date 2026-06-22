<script lang="ts">
	import { browser } from '$app/environment'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { snowStore } = getAppManagerContext()
</script>

{#if browser && snowStore.snowState.value !== 'off'}
	<snow-effect color="white" flakes={snowStore.flakesCount} speed={1}></snow-effect>
{/if}
