<script lang="ts">
	import { onMount } from 'svelte'
	import { TEXT } from '$lib/minigames/fishing/engine/texts'
	import type {
		AreaLocations,
		CatchEvent,
		FishingGameInstance,
		ProgressRepository,
		ProgressSnapshot,
		StartScreen
	} from '$lib/minigames/fishing/engine'

	interface Props {
		/**
		 * Root folder that holds `fishing/`, `cursors/` and `ice-480.webp`.
		 * Pass an absolute path when embedding on a nested route.
		 */
		publicBase?: string
		/** Base URL of the copied art/font folder. Default: `${publicBase}/fishing`. */
		assetBase?: string
		/** localStorage namespace, useful when embedding several games. */
		storagePrefix?: string
		muted?: boolean
		startScreen?: StartScreen
		/** Optional DB/HTTP-backed progress storage. */
		progress?: ProgressRepository
		/** Water bodies the host keeps closed; `false` seals a location. */
		locations?: AreaLocations
		onExit?: () => void
		onCatch?: (event: CatchEvent) => void
		onProgress?: (snapshot: ProgressSnapshot) => void
		onReady?: () => void
		/** Called when the engine cannot start at all (no WebGL, init failure). */
		onError?: (error: unknown) => void
		class?: string
	}

	let {
		publicBase,
		assetBase,
		storagePrefix = 'fishing-game',
		muted = false,
		startScreen = 'menu',
		progress,
		locations,
		onExit,
		onCatch,
		onProgress,
		onReady,
		onError,
		class: className = ''
	}: Props = $props()

	let host = $state<HTMLDivElement | null>(null)
	let game: FishingGameInstance | null = null

	onMount(() => {
		let disposed = false

		void (async () => {
			if (!host) return
			try {
				// Dynamic import keeps `window`/`document` out of module scope, so the
				// component is safe to render during SSR.
				const { createFishingGame } = await import('$lib/minigames/fishing/engine')
				if (disposed || !host) return

				const instance = await createFishingGame({
					container: host,
					publicBase,
					assetBase,
					storagePrefix,
					muted,
					startScreen,
					progress,
					locations,
					onExit,
					onCatch,
					onProgress,
					onReady
				})

				if (disposed) {
					instance.destroy()
					return
				}
				game = instance
			} catch (error) {
				console.error('[fishing-game] failed to initialise', error)
				if (!disposed) onError?.(error)
			}
		})()

		return () => {
			disposed = true
			game?.destroy()
			game = null
		}
	})

	export function restart(): void {
		game?.restart()
	}

	export function pause(): void {
		game?.pause()
	}

	export function resume(): void {
		game?.resume()
	}

	export function showMenu(): void {
		game?.showMenu()
	}

	export function setMuted(value: boolean): void {
		game?.setMuted(value)
	}

	/** Opens or closes water bodies without restarting the game. */
	export function setLocations(value: AreaLocations): void {
		game?.setLocations(value)
	}

	export function flushProgress(): Promise<void> {
		return game?.flushProgress() ?? Promise.resolve()
	}
</script>

<div
	bind:this={host}
	class="fishing-game {className}"
	role="application"
	aria-label={TEXT.common.ariaLabel}
></div>

<style>
	.fishing-game {
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
		min-height: 220px;
		overflow: hidden;
		background: #232a56;
		touch-action: none;
		-webkit-user-select: none;
		user-select: none;
	}

	/* Канвас создаёт движок, поэтому он вне скоупа Svelte. Игра рисует
	   собственный пиксельный курсор и включает `cursor-hidden`, как только
	   оверлей готов. */
	.fishing-game :global(canvas) {
		display: block;
		image-rendering: pixelated;
		image-rendering: crisp-edges;
	}

	.fishing-game :global(canvas.cursor-hidden) {
		cursor: none !important;
	}
</style>
