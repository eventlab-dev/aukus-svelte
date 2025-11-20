<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js'
	import type { HTMLAttributes } from 'svelte/elements'

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props()
</script>

<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn(
		'data-[state=selected]:bg-muted [&>td]:first:rounded-l-lg [&>td]:last:rounded-r-lg [&>td,th]:first:pl-3 [&>td,th]:last:pr-3',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</tr>
