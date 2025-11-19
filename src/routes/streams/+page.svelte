<svelte:head>
	<style>
		body > div,
		body > div > * {
			display: none !important;
		}
		body > div > div.test-page {
			display: block !important;
		}
	</style>
</svelte:head>

<div class="test-page"></div>

<style>
	:global(*) {
		margin: 0 !important;
		padding: 0 !important;
		box-sizing: border-box !important;
	}

	:global(html),
	:global(body) {
		width: 100% !important;
		height: 100% !important;
		overflow: hidden !important;
	}

	.test-page {
		position: fixed !important;
		top: 0 !important;
		left: 0 !important;
		width: 100vw !important;
		height: 100vh !important;
		background-color: black !important;
		z-index: 99999 !important;
	}
</style>

