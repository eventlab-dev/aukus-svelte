<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"inline-flex h-[calc(100%-1px)] flex-1 data-[state=active]:bg-primary data-[state=active]:shadow-none bg-secondary data-[state=active]:border-dashed items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 dark:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[state=active]:selected-text ",
		className
	)}
	{...restProps}
/>
