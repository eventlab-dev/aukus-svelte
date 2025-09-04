<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button } from '../ui/button';
	import { getCollapsibleContext } from './collapsibleContext';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	type Props = {
		class?: string;
		children: Snippet;
	};

	const { class: className, children }: Props = $props();

	const collapsible = getCollapsibleContext();
</script>

<Button
	variant="outline"
	class={[
		'relative h-[39px] flex-row justify-start rounded-lg border-none bg-card px-2.5 py-1.5 leading-[19px] font-bold',
		className
	]}
	onclick={() => collapsible.toggleCollapse()}
>
	{@render children()}
	<div
		class="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground [&_svg:not([class*='size-'])]:size-[19px]"
	>
		{#if collapsible.isCollapsed}
			<ChevronDown />
		{:else}
			<ChevronUp />
		{/if}
	</div>
</Button>
