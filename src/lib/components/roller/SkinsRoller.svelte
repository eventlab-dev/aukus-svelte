<script lang="ts">
	import { onDestroy } from 'svelte'
	import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
	import ImageLoader from '../ImageLoader.svelte'
	// import Volume from '@/components/icons/Volume.svelte'
	// import X from '@/components/icons/X.svelte'
	import { Button } from '../ui/button'
	import X from '@lucide/svelte/icons/x'
	import Volume_1 from '@lucide/svelte/icons/volume-1'
	import VolumeX from '@lucide/svelte/icons/volume-x'
	import Loader from '../Loader.svelte'

	// --- CONSTANTS (same as original)
	const FAST_SPIN_DURATION = 2000
	const MIN_SPIN_DURATION = 12000 // ms
	const BACKSWING_DURATION = 600 // ms
	const SETTLE_DURATION = 1200 // ms

	const CARD_WIDTH = 160 // px
	const CARD_HEIGHT = Math.floor(CARD_WIDTH * 1.4125) // px
	const GAP = 8 // px
	const CARD_FULL_WIDTH = CARD_WIDTH + GAP // px
	const BACKSWING_OFFSET = 60 // px

	const IDLE_CARD_COUNT = 21
	const MIN_CARD_IN_ROLL = 75

	// --- utility types (simple)
	export type WeightedOption = {
		value: string
		weight: number
		label: string
		imageUrl: string
		variant?: 'positive' | 'negative'
	}

	// --- helper functions (ported)
	function weightedRandom<T extends WeightedOption>(options: T[]): T {
		const totalWeight = options.reduce((sum, opt) => sum + (opt.weight ?? 0), 0)
		let r = Math.random() * totalWeight
		for (const opt of options) {
			if (r < opt.weight) return opt
			r -= opt.weight
		}
		return options[options.length - 1]
	}

	function generateList<T extends WeightedOption>(len: number, options: T[]): T[] {
		if (options.length === 0) {
			throw new Error('Need at least 2 options for neighbor constraint.')
		}
		if (options.length === 1) {
			return Array(len).fill(options[0])
		}
		const result: T[] = []
		for (let i = 0; i < len; i++) {
			const available =
				i === 0 ? options : options.filter((opt) => opt.value !== result[i - 1].value)
			if (available.length === 0) {
				throw new Error('No valid options to choose from at position ' + i)
			}
			const choice = weightedRandom(available)
			result.push(choice)
		}
		return result
	}

	function getRandomExcept<T extends WeightedOption>(options: T[], exclude: T): T {
		if (options.length === 0) {
			throw new Error('Need at least 1 option')
		}
		const available = options.filter((opt) => exclude.value !== opt.value)
		if (available.length === 0) return exclude
		return available[Math.floor(Math.random() * available.length)]
	}

	// --- localStorage helper (simple)
	function useLocalStorage<T>(key: string, initial: T) {
		let value: T = initial
		try {
			const raw = localStorage.getItem(key)
			if (raw !== null) {
				value = JSON.parse(raw)
			}
		} catch {
			// ignore
		}
		function save(next: T) {
			value = next
			try {
				localStorage.setItem(key, JSON.stringify(value))
			} catch {
				// ignore
			}
		}
		function get() {
			return value
		}
		return { get, save }
	}

	// --- Minimal sound manager (placeholder) ---
	// Replace with your project's Svelte sound manager if you have one.
	function createSoundManager() {
		let playing = false
		function playRandom() {
			// placeholder: integrate your audio / random clip playback here
			playing = true
		}
		function stop() {
			// placeholder
			playing = false
		}
		return { playRandom, stop, isPlaying: () => playing }
	}

	// ----------------------------
	// --- component props
	// ----------------------------

	type Props = {
		autoOpen?: boolean
		options: WeightedOption[]
		header: string
		openButtonText?: string
		finishButtonText?: string
		onRollFinish: (option: WeightedOption) => Promise<void>
		onClose?: () => void
		getWinnerText: (option: WeightedOption) => string
		getSecondaryText?: (option: WeightedOption) => string | undefined
		showTrigger?: boolean
	}

	let {
		autoOpen = false,
		options,
		header,
		openButtonText = 'Открыть рулетку',
		finishButtonText = 'Закрыть',
		onRollFinish,
		onClose,
		getWinnerText,
		getSecondaryText,
		showTrigger
	}: Props = $props()

	// ----------------------------
	// --- local reactive state
	// ----------------------------
	let rouletteEl: HTMLDivElement | null = $state(null)

	let animationId: number | null = null
	let isRolling = false
	let centerIndex = 0
	let offset = $state(0)
	let isIdleRunning = false

	const lsMuted = useLocalStorage<boolean>('roller-sound-muted', false)
	let isMuted = lsMuted.get()
	const sound = createSoundManager()

	let winnerIndex: number | null = $state(null)
	let isOpen = $state(false)
	let rollPhase: 'idle' | 'rolling' | 'finished' = $state('idle')
	let cardList: WeightedOption[] = $state([])
	let currentCardIndex = $state(0)

	// states for mutation
	let isLoading = $state(false)
	let isError = $state(false)

	// computed
	const winner = $derived(winnerIndex !== null ? cardList[winnerIndex] : null)

	const headerText = $derived.by(() => {
		if (rollPhase === 'rolling') {
			if (cardList[currentCardIndex]) return getWinnerText(cardList[currentCardIndex])
			return header
		}
		if (winner !== null) {
			return getWinnerText(winner)
		}
		return header
	})

	const secondaryText = $derived(winner ? getSecondaryText?.(winner) : undefined)

	const fastRoll = options.length === 1

	// ----------------------------
	// --- animation helpers
	// ----------------------------
	function updateTransform() {
		if (rouletteEl) {
			rouletteEl.style.transform = `translateX(${offset}px)`
		}
	}

	function idleAnimate() {
		const speed = 1
		const direction = -1
		offset += speed * direction
		updateTransform()

		const indexNow = -Math.floor(offset / CARD_FULL_WIDTH)
		// if index changed relative to centerIndex (mimic logic)
		if (indexNow !== centerIndex) {
			if (direction < 0) {
				// shift left: remove first, append random after last
				const last = cardList[cardList.length - 1]
				cardList = [...cardList.slice(1), getRandomExcept(options, last)]
				offset += CARD_FULL_WIDTH
			} else {
				const first = cardList[0]
				cardList = [getRandomExcept(options, first), ...cardList.slice(0, -1)]
				offset -= CARD_FULL_WIDTH
			}
			centerIndex = Math.floor(cardList.length / 2)
		}

		animationId = requestAnimationFrame(idleAnimate)
	}

	// main rolling animation (ported and simplified)
	function startRollingAnimation() {
		// bezier easing implementation could be included or use simple easing functions.
		// For fidelity to original, we approximate easing with built-in polynomials.
		const spinDuration = fastRoll ? FAST_SPIN_DURATION : MIN_SPIN_DURATION + Math.random() * 2000

		let startPosition = offset
		const randomOffset = Math.floor(Math.random() * (CARD_WIDTH + GAP / 2))
		const cardOffset = MIN_CARD_IN_ROLL + Math.floor(Math.random() * 5)
		const endPosition = -CARD_FULL_WIDTH * cardOffset - randomOffset
		const isOnGap = randomOffset > CARD_WIDTH

		let phase: 'backswing' | 'spin' | 'settle' = 'backswing'
		let animationStartTime = 0

		function easeSpin(t: number) {
			// approximate cubic ease
			return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
		}
		function easeBack(t: number) {
			return t * t * (3 - 2 * t)
		}
		function easeSettle(t: number) {
			return 1 - Math.pow(1 - t, 3)
		}

		function animate(now: number) {
			if (animationStartTime === 0) animationStartTime = now
			const elapsed = now - animationStartTime

			if (phase === 'backswing') {
				const progress = Math.min(elapsed / BACKSWING_DURATION, 1)
				const eased = easeBack(progress)
				offset = startPosition + BACKSWING_OFFSET * eased
				updateTransform()
				if (progress >= 1) {
					phase = 'spin'
					animationStartTime = now
					startPosition += BACKSWING_OFFSET
				}
				animationId = requestAnimationFrame(animate)
			} else if (phase === 'spin') {
				const progress = Math.min(elapsed / spinDuration, 1)
				const eased = easeSpin(progress)
				offset = startPosition + (endPosition - startPosition) * eased
				updateTransform()

				if (progress >= 1) {
					if (isOnGap) {
						phase = 'settle'
						animationStartTime = now
					} else {
						finishAnimation()
						return
					}
				}
				animationId = requestAnimationFrame(animate)
			} else if (phase === 'settle') {
				const progress = Math.min(elapsed / SETTLE_DURATION, 1)
				const eased = easeSettle(progress)
				offset = endPosition + GAP * eased
				updateTransform()

				if (progress >= 1) {
					finishAnimation()
					animationId = null
				} else {
					animationId = requestAnimationFrame(animate)
				}
			}

			// update visible currentCardIndex
			const newIndex = Math.floor(-offset / CARD_FULL_WIDTH)
			if (newIndex !== currentCardIndex) {
				currentCardIndex = newIndex
			}
		}

		function finishAnimation() {
			const indexReal = Math.floor(-offset / CARD_FULL_WIDTH)
			const index = indexReal
			winnerIndex = index
			rollPhase = 'finished'
			sound.stop()
			// call mutation (onRollFinish)
			isLoading = true
			isError = false
			const winner = cardList[index]
			onRollFinish?.(winner)
				.then(() => {
					isLoading = false
				})
				.catch(() => {
					isLoading = false
					isError = true
				})
			animationId = null
			isRolling = false
		}

		animationId = requestAnimationFrame(animate)
	}

	// resets initial state
	function resetState() {
		const randomCards = generateList(IDLE_CARD_COUNT, options)
		cardList = randomCards
		rollPhase = 'idle'
		centerIndex = Math.floor(IDLE_CARD_COUNT / 2)
		offset = -((centerIndex - 1) * CARD_FULL_WIDTH + CARD_WIDTH / 2)
		updateTransform()
	}

	// open/close handler
	function handleOpenChange(open: boolean) {
		isOpen = open
		if (open) {
			resetState()
			// start idle animation
			if (!isIdleRunning) {
				isIdleRunning = true
				animationId = requestAnimationFrame(idleAnimate)
			}
		} else {
			if (animationId !== null) cancelAnimationFrame(animationId)
			sound.stop()
			winnerIndex = null
			animationId = null
			isIdleRunning = false
			onClose?.()
		}
	}

	// react to autoOpen prop
	$effect(() => {
		if (autoOpen && !isOpen) {
			resetState()
			isOpen = true
		}
	})

	// watchers (simulate React effects)
	$effect(() => {
		if (rollPhase === 'idle' && cardList.length > 0) {
			if (!isIdleRunning) {
				isIdleRunning = true
				if (animationId !== null) cancelAnimationFrame(animationId)
				animationId = requestAnimationFrame(idleAnimate)
			}
		}

		if (rollPhase === 'rolling' && cardList.length > IDLE_CARD_COUNT && !isRolling) {
			isRolling = true
			if (animationId !== null) cancelAnimationFrame(animationId)
			startRollingAnimation()
		}
	})

	$effect(() => {
		if (!isMuted && rollPhase === 'rolling') {
			sound.playRandom()
		}
	})

	function handleRollClick() {
		// your original used useSystemStore.getState().enableQueries(false);
		// If you have a store, call it; otherwise omit.
		rollPhase = 'rolling'
		const randomCards = generateList(150, options)
		cardList = [...cardList, ...randomCards]
		if (animationId !== null) {
			cancelAnimationFrame(animationId)
			animationId = null
		}
		// rolling animation will start from reactive watcher above
	}

	function toggleMute() {
		if (!isMuted) sound.stop()
		isMuted = !isMuted
		lsMuted.save(isMuted)
	}

	onDestroy(() => {
		if (animationId !== null) cancelAnimationFrame(animationId)
		sound.stop()
	})
</script>

<!-- UI (shadcn components + tailwind classes) -->
<Dialog bind:open={isOpen} onOpenChange={handleOpenChange}>
	{#if showTrigger}
		<DialogTrigger>
			<Button>{openButtonText}</Button>
		</DialogTrigger>
	{/if}

	<DialogContent
		class="m-0 flex h-screen w-full min-w-full flex-col items-center justify-center overflow-hidden p-0 backdrop-blur-sm md:rounded-none md:bg-transparent"
		onkeydown={(e) => {
			if (e.key === 'Escape' && rollPhase === 'rolling') {
				e.preventDefault()
			}
		}}
		showCloseButton={false}
	>
		<DialogHeader class="absolute bottom-[70%] max-w-4xl">
			<DialogTitle class="font-wide-black text-center text-2xl">{headerText}</DialogTitle>
		</DialogHeader>

		<div class="absolute left-1/2">
			<!-- top/bottom markers -->
			<div
				class="absolute top-0 z-20 -translate-x-1/2 -translate-y-1/2 border-t-[18px] border-r-[18px] border-l-[18px] border-primary border-r-transparent border-l-transparent"
			></div>
			<div
				class="absolute bottom-0 z-20 -translate-x-1/2 translate-y-1/2 border-r-[18px] border-b-[18px] border-l-[18px] border-primary border-r-transparent border-l-transparent"
			></div>

			<div
				bind:this={rouletteEl}
				style="gap: {GAP}px; transform: translateX({offset}px);"
				class="flex items-center"
			>
				{#each cardList as item, idx (idx)}
					{#key idx}
						<div class="rounded-xl bg-card">
							<ImageLoader
								src={item.imageUrl}
								alt={item.label}
								class="transition-all duration-400 ease-in-out data-[dimmed=true]:opacity-95 data-[dimmed=true]:brightness-50"
								data-dimmed={rollPhase === 'finished' && idx !== winnerIndex}
								style="
                height: {idx === winnerIndex ? CARD_HEIGHT * 1.25 + 'px' : CARD_HEIGHT + 'px'};
                width: {idx === winnerIndex ? CARD_WIDTH * 1.25 + 'px' : CARD_WIDTH + 'px'};
                transition: all 0.4s ease;
                border-radius: 10px;
              "
							/>
						</div>
					{/key}
				{/each}
			</div>
		</div>

		{#if rollPhase === 'idle'}
			<Button
				class="absolute bottom-[25%] w-[300px] rounded-xl text-[16px]"
				onclick={handleRollClick}
			>
				Заролить
			</Button>
		{/if}

		{#if rollPhase === 'idle'}
			<Button
				variant="ghost"
				class="absolute top-[25%] right-[25%] rounded-xl"
				onclick={() => handleOpenChange(false)}
			>
				<X style="width:25px;height:25px;" />
			</Button>
		{/if}

		<Button
			variant="outline"
			size="icon"
			class="absolute z-20 rounded-xl border-0 bg-white/20 hover:bg-white/10"
			style="top:65%; right:20px;"
			onclick={toggleMute}
		>
			{#if isMuted}
				<VolumeX class="h-4 w-4" />
			{:else}
				<Volume_1 class="h-4 w-4" />
			{/if}
		</Button>

		{#if rollPhase === 'finished'}
			<div class="absolute bottom-[15%] flex flex-col items-center justify-center gap-4">
				{#if secondaryText}
					<div class="w-200 text-center text-base font-semibold">{secondaryText}</div>
				{/if}
				<Button
					class="w-[300px] rounded-xl"
					disabled={isError || isLoading}
					onclick={() => {
						handleOpenChange(false)
					}}
				>
					{#if isLoading}<Loader />{/if}
					{#if isError}Ошибка{:else}{finishButtonText}{/if}
				</Button>
			</div>
		{/if}
	</DialogContent>
</Dialog>

<style>
	/* small local styles; keep tailwind classes in markup where possible */
	.roulette-wrapper {
		display: flex;
		align-items: center;
		transition: transform 0.1s linear;
		gap: /* fallback if custom property missing */ 8px;
	}
</style>
