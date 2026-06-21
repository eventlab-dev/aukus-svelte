<script lang="ts">
	import { quadOut } from 'svelte/easing'
	import { Tween } from 'svelte/motion'

	type Props = {
		value?: number | null
	}

	let { value: lockedItemIndex = $bindable(0) }: Props = $props()

	const ITEM_WIDTH = 44
	const ITEM_HEIGHT = 26
	const HALF_ITEM_WIDTH = ITEM_WIDTH / 2
	const GAP = 6
	const ITEM_SPACING = ITEM_WIDTH + GAP
	const ROUNDED = 12
	const items = Array.from({ length: 11 }, (_, i) => i)

	let hoveredProgressWidth = new Tween(calculateWidth(lockedItemIndex), {
		duration: 200,
		easing: quadOut
	})
	let hoveredItemIndex = $state(lockedItemIndex)
	let isHovered = $state(false)

	const lockedProgressWidth = $derived.by(() => calculateWidth(lockedItemIndex))
	const progressWidth = $derived(isHovered ? hoveredProgressWidth.current : lockedProgressWidth)
	const itemIndex = $derived(isHovered ? hoveredItemIndex : lockedItemIndex)
	const color = $derived.by(getColor)

	let timeoutId: ReturnType<typeof setTimeout>

	function getColor() {
		if (itemIndex === null || itemIndex <= 3) return 'bg-red-500'
		if (itemIndex <= 6) return 'bg-amber-500'
		if (itemIndex <= 9) return 'bg-green-500'
		return 'bg-purple-500'
	}

	function calculateWidth(index: number | null) {
		if (index === null) return 0

		const isInteger = Number.isInteger(index)
		const secondHalfOffset = isInteger ? ITEM_WIDTH : ITEM_WIDTH + GAP / 2

		return index * ITEM_WIDTH + index * GAP + secondHalfOffset
	}

	function onclick() {
		lockedItemIndex = hoveredItemIndex
	}

	function onmouseleave() {
		clearInterval(timeoutId)
		isHovered = false
		hoveredProgressWidth.target = lockedProgressWidth
	}

	function onmouseenter() {
		timeoutId = setTimeout(() => {
			isHovered = true
		}, 100) // может быть стоит уменьшить, хз
	}

	function onmousemove(event: MouseEvent & { currentTarget: HTMLButtonElement }) {
		if (!isHovered) return

		const { left } = event.currentTarget.getBoundingClientRect()
		const relativeX = event.clientX - left
		const itemIndex = Math.floor(relativeX / ITEM_SPACING)

		if (itemIndex === 0) {
			hoveredProgressWidth.target = ITEM_WIDTH
			hoveredItemIndex = itemIndex
			return
		}

		const positionInItem = relativeX % ITEM_SPACING
		const isSecondHalf = positionInItem > HALF_ITEM_WIDTH
		const finalIndex = itemIndex - (isSecondHalf ? 0 : 0.5)
		const width = calculateWidth(finalIndex)

		hoveredProgressWidth.target = width
		hoveredItemIndex = finalIndex
	}
</script>

<div class="flex flex-col gap-4">
	<svg width="0" height="0" style="position: absolute;">
		<mask id="mask">
			{#each items as n, idx (n)}
				<rect
					x={idx * (ITEM_WIDTH + GAP)}
					width={ITEM_WIDTH}
					height={ITEM_HEIGHT}
					rx={ROUNDED}
					ry={ROUNDED}
					fill="white"
				/>
			{/each}
		</mask>
	</svg>

	<button
		class="relative w-fit cursor-pointer border-0 bg-transparent"
		{onclick}
		{onmouseenter}
		{onmouseleave}
		{onmousemove}
	>
		<div
			class="absolute z-20 h-full {color} mask-[url(#mask)] mask-intersect mask-alpha mask-repeat-x transition-colors data-[hovered=false]:transition-all data-[hovered=false]:duration-500"
			data-hovered={isHovered}
			style="width: {progressWidth}px; mask-size: {ITEM_WIDTH}px {ITEM_HEIGHT}px;"
		></div>
		<div
			class="pointer-events-none absolute z-10 h-full w-full bg-muted mask-[url(#mask)] mask-intersect mask-alpha mask-repeat-x transition-all duration-500 data-[disabled=true]:opacity-50"
			style="mask-size: {ITEM_WIDTH}px {ITEM_HEIGHT}px;"
			data-disabled={lockedProgressWidth > 0 && !isHovered}
		></div>

		<div class="relative z-30 flex gap-1.5">
			{#each items as num (num)}
				<div
					class="flex items-center justify-center text-sm font-bold transition-all select-none data-[disabled=true]:opacity-50"
					data-disabled={lockedProgressWidth > 0 &&
						num > Math.ceil(lockedItemIndex || 0) &&
						!isHovered}
					style="width: {ITEM_WIDTH}px; height: {ITEM_HEIGHT}px;"
				>
					{num}
				</div>
			{/each}
		</div>
	</button>
</div>
