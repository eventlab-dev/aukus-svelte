<script lang="ts">
	import type { Snippet } from 'svelte'
	import { cn } from '$lib/utils.js'
	import DashedBorder from './DashedBorder.svelte'

	// Обёртка с мерной пунктирной обводкой: сама меряет свой div через
	// DashedBorder, снаружи нужны только контент и отступы.
	type Props = {
		radius?: number
		class?: string
		children: Snippet
	}

	const { radius = 18, class: className = '', children }: Props = $props()

	let box: HTMLElement | null = $state(null)
</script>

<div bind:this={box} class={cn('relative', className)}>
	<DashedBorder anchor={box} {radius} />
	{@render children()}
</div>
