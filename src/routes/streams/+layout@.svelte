<script lang="ts">
	let { children } = $props()
</script>

<svelte:head>
	<style>
		html, body {
			margin: 0 !important;
			padding: 0 !important;
			overflow: hidden !important;
			width: 100%;
			height: 100%;
		}
	</style>
</svelte:head>

{@render children?.()}

