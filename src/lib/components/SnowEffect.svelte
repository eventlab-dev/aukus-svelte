<script lang="ts">
	import { browser } from '$app/environment'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { snowStore } = getAppManagerContext()
	const { flakesCount, snowState } = snowStore
</script>

{#if browser && $snowState !== 'off'}
	<snow-effect color="white" flakes={$flakesCount} speed={1}></snow-effect>
{/if}
