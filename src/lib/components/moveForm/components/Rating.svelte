<script lang="ts">
	import StarIcon from '$lib/components/icons/new/StarIcon.svelte'
	import { scoreToTier } from '$lib/utils'

	type Props = {
		value?: number | null
	}

	let { value: lockedValue = $bindable(0) }: Props = $props()

	const STAR_COUNT = 10
	const stars = Array.from({ length: STAR_COUNT }, (_, i) => i + 1)

	let hoveredValue = $state(lockedValue)
	let isHovered = $state(false)

	const displayedValue = $derived(isHovered ? hoveredValue : lockedValue)
	const color = $derived.by(getColor)

	function getColor() {
		const tier = scoreToTier(displayedValue)
		return tier?.color ?? scoreToTier(0)!.color
	}

	function getStarFill(starIndex: number, v: number): 'full' | 'half' | 'empty' {
		if (v >= starIndex) return 'full'
		if (v >= starIndex - 0.5) return 'half'
		return 'empty'
	}

	function valueFromEvent(
		e: MouseEvent & { currentTarget: HTMLElement },
		starIndex: number
	): number {
		const rect = e.currentTarget.getBoundingClientRect()
		const relX = e.clientX - rect.left
		const isLeftHalf = relX < rect.width / 2
		return isLeftHalf ? starIndex - 0.5 : starIndex
	}

	function onmouseenter() {
		isHovered = true
	}

	function onmouseleave() {
		isHovered = false
	}

	function onmousemove(e: MouseEvent & { currentTarget: HTMLElement }) {
		hoveredValue = valueFromEvent(e, Number(e.currentTarget.dataset.star))
	}

	function onclick(e: MouseEvent & { currentTarget: HTMLElement }) {
		lockedValue = valueFromEvent(e, Number(e.currentTarget.dataset.star))
	}
</script>

<div class="flex items-center gap-1.5">
	{#each stars as n (n)}
		{@const fill = getStarFill(n, displayedValue ?? 0)}
		<button
			type="button"
			data-star={n}
			class="relative flex h-9 w-9 cursor-pointer items-center justify-center"
			{onmouseenter}
			{onmouseleave}
			{onmousemove}
			{onclick}
		>
			<StarIcon class="absolute inset-0 h-full w-full text-muted-foreground" />
			{#if fill === 'full'}
				<StarIcon class="absolute inset-0 h-full w-full" style="color: {color}" />
			{:else if fill === 'half'}
				<StarIcon
					class="absolute inset-0 h-full w-full"
					style="color: {color}; clip-path: inset(0 50% 0 0);"
				/>
			{/if}
			<span
				class="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold"
				style="color: #1f2937"
			>
				{n}
			</span>
		</button>
	{/each}
</div>
