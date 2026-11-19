<script lang="ts">
	import { onMount } from 'svelte'

	import { goto } from '$app/navigation'
	import { Button } from '$lib/components/ui/button'
	import FishingGame from '$lib/components/FishingGame.svelte'
	import { FISHING_ASSETS_CDN } from '$lib/constants'
	import { TEXT } from '$lib/minigames/fishing/engine/texts'

	let failed = $state(false)

	const fontBase = `${FISHING_ASSETS_CDN}/fishing/fonts`

	onMount(() => {
		return () => {
			if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
		}
	})

	function backToMap(): void {
		// replaceState: выход из игры не должен оставлять её в истории, иначе
		// «Назад» из карты возвращает обратно в рыбалку.
		goto('/', { replaceState: true })
	}
</script>

<svelte:head>
	<title>{TEXT.page.title} — Aukus</title>
	<link
		rel="preload"
		href="{fontBase}/tiny5-cyrillic.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
	<link
		rel="preload"
		href="{fontBase}/tiny5-latin.woff2"
		as="font"
		type="font/woff2"
		crossorigin="anonymous"
	/>
</svelte:head>

<div class="fishing-shell bg-background">
	<FishingGame
		storagePrefix="aukus5-fishing"
		publicBase={FISHING_ASSETS_CDN}
		startScreen="menu"
		onExit={backToMap}
		onError={() => (failed = true)}
	/>

	{#if failed}
		<div
			class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background/95 px-6 text-center"
		>
			<p class="font-display text-lg font-bold uppercase">Не удалось загрузить рыбалку</p>
			<p class="max-w-md text-sm text-muted-foreground">
				Похоже, браузер не смог запустить игру. Попробуйте обновить страницу или открыть её в другом
				браузере.
			</p>
			<Button onclick={backToMap}>Вернуться на карту</Button>
		</div>
	{/if}
</div>

<style>
	/* Полноэкранная оболочка маршрута.
	   Канвас считается от clientWidth/clientHeight контейнера, поэтому padding
	   безопасной зоны становится его полем: вырез и домашняя полоска iPhone не
	   накрывают HUD и нижнюю строку, а игра сама вписывается в оставшееся.
	   100dvh следует за панелью браузера, 100vh остаётся фолбэком. */
	.fishing-shell {
		position: fixed;
		inset: 0;
		height: 100vh;
		height: 100dvh;
		padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
			env(safe-area-inset-left);
		overflow: hidden;
		-webkit-tap-highlight-color: transparent;
	}
</style>
