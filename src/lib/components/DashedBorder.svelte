<script lang="ts">
	import { cn } from '$lib/utils.js'

	// ТЕСТОВЫЙ компонент пунктирной обводки (потом удалить).
	// Меряет anchor через ResizeObserver и чертит прямоугольник
	// точными числами (без calc), поэтому дэши не плывут.
	type Props = {
		anchor?: HTMLElement | null
		color?: string
		strokeWidth?: number
		dash?: number
		gap?: number
		radius?: number
		class?: string
	}

	const {
		anchor = null,
		color = '#BAC7F2',
		strokeWidth = 4,
		dash = 8,
		gap = 8,
		radius = 16,
		class: className = ''
	}: Props = $props()

	let w = $state(0)
	let h = $state(0)

	$effect(() => {
		if (!anchor) return
		const measure = () => {
			w = anchor.offsetWidth + strokeWidth
			h = anchor.offsetHeight + strokeWidth
		}
		measure()
		const observer = new ResizeObserver(measure)
		observer.observe(anchor)
		return () => observer.disconnect()
	})

	const half = $derived(strokeWidth / 2)
</script>

<svg
	class={cn('pointer-events-none absolute z-20', className)}
	style="inset: {-half}px"
	width={w}
	height={h}
	fill="none"
	aria-hidden="true"
>
	{#if w > 0 && h > 0}
		<rect
			x={half}
			y={half}
			width={w - strokeWidth}
			height={h - strokeWidth}
			rx={radius}
			stroke={color}
			stroke-width={strokeWidth}
			stroke-dasharray={`${dash} ${gap}`}
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{/if}
</svg>
