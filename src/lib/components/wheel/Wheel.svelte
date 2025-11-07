<script lang="ts">
	import { onMount } from 'svelte'
	import { circIn } from 'svelte/easing'
	import { fly, scale } from 'svelte/transition'
	import StartButton from './components/StartButton.svelte'
	import Pointer from './components/Pointer.svelte'
	import { doubleSineEaseOut } from '$lib/utils'

	export type WheelEntry = {
		id: number
		label: string
		weight?: number
		imageUrl?: string
		color?: string
	}

	type EntryWithAngles = WheelEntry & { startAngle: number; endAngle: number }

	type Props = {
		entries: WheelEntry[]
		size?: number
		spinTimeSeconds?: number
		onSpinStart?: (spinDelayMs: number) => void | boolean | Promise<void | boolean>
		onSpinEnd?: (entry: EntryWithAngles) => void
	}

	const { entries, size, spinTimeSeconds = 10, onSpinStart, onSpinEnd }: Props = $props()

	const degreesToRadians = Math.PI / 180
	const LINE_WIDTH = 5
	const STROKE_COLOR = 'white'
	const STROKE_HIGHLIGHT_COLOR = '#fd8c2a'
	const DRAW_OFFSET = LINE_WIDTH
	const BACKSWING_DURATION = 500
	const BACKSWING_ANGLE = 105

	// const { playRandom, stop: stopSound } = useSound(isMuted, true);
	// let isMuted = storable('roller-sound-muted', false);

	let isSpinning = $state(false)
	let radius = $state(size ? size / 2 : 0)

	// random rotation angle in degrees
	let rotation = $state(Math.random() * 360)
	let images: Record<string, HTMLImageElement> = $state({})
	let winner: EntryWithAngles | null = $state(null)

	let canvasRef: HTMLCanvasElement | null = $state(null)
	let ctx: CanvasRenderingContext2D | null = $state(null)
	let canvasContainerRef: HTMLDivElement | null = $state(null)

	let backswingRotation = $state(0)
	let totalRotation = $state(0)

	const spinDuration = $derived(spinTimeSeconds * 1000)
	const textSize = $derived(Math.round(radius / 16))
	const fontStyle = $derived(`700 ${textSize}px Golos Text`)
	const buttonSize = $derived(radius / 2)
	const textOffsetFromCenter = $derived(Math.min(1, Math.max(0, (radius * 0.35) / radius)))
	const entriesWithAngles: EntryWithAngles[] = $derived.by(getEntriesWithAngles)

	let animationId = 0
	let animationStartTime = 0

	onMount(() => {
		if (canvasRef) {
			ctx = canvasRef.getContext('2d')
		}

		return () => cancelAnimationFrame(animationId)
	})

	$effect(() => {
		if (ctx) {
			ctx.font = fontStyle
			ctx.textBaseline = 'middle'
			ctx.textAlign = 'start'
		}
	})

	$effect(() => {
		if (radius > 0) {
			drawWheel()
		}
	})

	$effect(() => {
		const hasNewImages = entriesWithAngles.some(
			(entry) => entry.imageUrl && !images[entry.imageUrl]
		)

		if (hasNewImages) {
			loadImages(entriesWithAngles)
		}
	})

	function drawText({ label, startAngle, endAngle }: EntryWithAngles) {
		if (!ctx) return

		const midAngle = (startAngle + endAngle) / 2
		const cosMidAngle = Math.cos(midAngle * degreesToRadians)
		const sinMidAngle = Math.sin(midAngle * degreesToRadians)
		const textX = radius + radius * textOffsetFromCenter * cosMidAngle
		const textY = radius + radius * textOffsetFromCenter * sinMidAngle

		ctx.fillStyle = 'white' // white
		ctx.strokeStyle = 'black'
		ctx.lineWidth = 3

		ctx.save()
		ctx.translate(textX, textY)
		ctx.rotate(midAngle * degreesToRadians)
		// ctx.strokeText(label, 0, 0);
		ctx.fillText(label, 0, 0)
		ctx.restore()
	}

	function drawEntry(
		entry: EntryWithAngles,
		centerX: number,
		centerY: number,
		isHighlighted: boolean
	) {
		if (!ctx) return

		const { startAngle, endAngle } = entry
		const strokeColor = isHighlighted ? STROKE_HIGHLIGHT_COLOR : STROKE_COLOR
		const img = entry.imageUrl ? images[entry.imageUrl] : null

		// Draw slice border first
		ctx.beginPath()
		ctx.moveTo(centerX, centerY)
		ctx.arc(
			centerX,
			centerY,
			Math.min(radius - DRAW_OFFSET, radius - DRAW_OFFSET),
			entry.startAngle * degreesToRadians,
			entry.endAngle * degreesToRadians
		)

		if (!img && entry.color) {
			ctx.fillStyle = entry.color
			ctx.fill()
			drawText(entry)
		}

		ctx.closePath()
		ctx.strokeStyle = strokeColor
		ctx.lineWidth = LINE_WIDTH
		ctx.stroke()

		if (img) {
			ctx.save()
			ctx.beginPath()
			ctx.moveTo(centerX, centerY)
			ctx.arc(
				centerX,
				centerY,
				Math.min(radius - DRAW_OFFSET, radius - DRAW_OFFSET),
				startAngle * degreesToRadians,
				endAngle * degreesToRadians
			)
			ctx.clip()

			const angle = (startAngle + endAngle) / 2
			const cosMidAngle = Math.cos(angle * degreesToRadians)
			const sinMidAngle = Math.sin(angle * degreesToRadians)
			const imgX = centerX + (cosMidAngle * radius) / 2 - radius / 2
			const imgY = centerY + (sinMidAngle * radius) / 2 - radius / 2

			// Rotate image to the center
			ctx.translate(imgX + radius / 2, imgY + radius / 2)
			ctx.rotate((angle + 90) * degreesToRadians)
			ctx.drawImage(img, -radius / 2, -radius / 2, radius, radius)
			ctx.restore()

			// Draw slice border
			ctx.beginPath()
			ctx.moveTo(centerX, centerY)
			ctx.arc(
				centerX,
				centerY,
				Math.min(radius - DRAW_OFFSET, radius - DRAW_OFFSET),
				startAngle * degreesToRadians,
				endAngle * degreesToRadians
			)
			ctx.closePath()
			ctx.save()
			if (isHighlighted) {
				ctx.shadowColor = 'gold'
				ctx.shadowBlur = 10
			}
			ctx.strokeStyle = strokeColor
			ctx.lineWidth = LINE_WIDTH
			ctx.stroke()
			ctx.restore()
		}
	}

	function drawWheel() {
		if (!ctx || !canvasRef) return

		const centerX = canvasRef.width / 2
		const centerY = canvasRef.height / 2

		ctx.clearRect(0, 0, canvasRef.width, canvasRef.height)

		for (const entry of entriesWithAngles) {
			drawEntry(entry, centerX, centerY, false)
		}
	}

	function getCurrentEntry() {
		const angle = ((-rotation % 360) + 360) % 360

		return (
			entriesWithAngles.find((item) => item.startAngle <= angle && angle < item.endAngle) ?? null
		)
	}

	async function spinWheel() {
		if (isSpinning) return

		const extraSpins = spinTimeSeconds * 360
		const landing = Math.floor(Math.random() * 360)
		backswingRotation = rotation - BACKSWING_ANGLE
		totalRotation = backswingRotation + extraSpins + landing

		winner = null
		isSpinning = true
		animationStartTime = performance.now()
		onSpinStart?.(BACKSWING_DURATION)

		animationId = requestAnimationFrame(backswing)
	}

	function backswing(time: number) {
		const progress = (time - animationStartTime) / BACKSWING_DURATION
		const clampedProgress = Math.min(progress, 1)
		const easedProgress = circIn(clampedProgress)

		rotation = rotation + (backswingRotation - rotation) * easedProgress
		animationId = requestAnimationFrame(backswing)

		if (progress >= 1) {
			cancelAnimationFrame(animationId)
			animationStartTime = performance.now()
			animationId = requestAnimationFrame(spin)
		}
	}

	function spin(time: number) {
		const progress = (time - animationStartTime) / spinDuration
		const clampedProgress = Math.min(progress, 1)
		const easedProgress = doubleSineEaseOut(clampedProgress)

		rotation = backswingRotation + (totalRotation - backswingRotation) * easedProgress
		animationId = requestAnimationFrame(spin)

		if (progress >= 1) {
			cancelAnimationFrame(animationId)

			winner = getCurrentEntry()
			if (winner !== null) onSpinEnd?.(winner)

			rotation = rotation % 360
			isSpinning = false
		}
	}

	function getEntriesWithAngles() {
		const totalValue = entries.reduce((acc, cur) => acc + (cur.weight || 1), 0)
		let cumulativeAngle = 0

		return entries.map((item) => {
			const angle = ((item.weight || 1) / totalValue) * 360
			const startAngle = cumulativeAngle
			cumulativeAngle += angle

			return { ...item, startAngle, endAngle: cumulativeAngle }
		})
	}

	async function loadImages(entries: EntryWithAngles[]) {
		const imageMap: Record<string, HTMLImageElement> = {}

		const imageLoadingPromises = entries.map((entry) => {
			return new Promise<void>((resolve) => {
				// Skip entries without image URLs
				if (!entry.imageUrl) {
					resolve()
					return
				}

				const image = new Image()
				image.src = entry.imageUrl

				image.onload = () => {
					imageMap[entry.imageUrl!] = image
					resolve()
				}

				// Silently skip broken images
				image.onerror = () => resolve()
			})
		})

		await Promise.all(imageLoadingPromises)
		images = imageMap
	}
</script>

<div class="relative flex items-center justify-center" in:scale>
	{#if winner}
		<div
			class="absolute bottom-[calc(100%_+_3rem)] left-1/2 -translate-x-1/2 text-2xl font-bold"
			transition:fly={{ y: 100 }}
		>
			{winner.label}
		</div>
	{/if}
	<div class="absolute -top-2 left-1/2 z-20 -translate-1/2">
		<Pointer />
	</div>
	<div class="absolute top-1/2 left-1/2 z-20 -translate-1/2">
		<StartButton
			{isSpinning}
			{textSize}
			{buttonSize}
			strokeColor={STROKE_COLOR}
			borderWidth={LINE_WIDTH}
			onclick={spinWheel}
		/>
	</div>
	<div
		bind:this={canvasContainerRef}
		class="relative z-10 rounded-full select-none"
		style="transform: rotate({rotation}deg) translateZ(0);"
		draggable="false"
	>
		<canvas
			bind:this={canvasRef}
			class="pointer-events-none rotate-[-90deg]"
			width={radius * 2}
			height={radius * 2}
		></canvas>
	</div>
</div>
