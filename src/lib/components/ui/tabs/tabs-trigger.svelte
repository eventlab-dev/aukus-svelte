<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui'
	import { cn } from '$lib/utils.js'

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props()
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"inline-flex h-[43px] max-w-fit flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-secondary px-4 py-1 font-extrabold whitespace-nowrap text-foreground transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:selected-text data-[state=active]:border-dashed data-[state=active]:bg-primary data-[state=active]:shadow-none dark:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
/>
