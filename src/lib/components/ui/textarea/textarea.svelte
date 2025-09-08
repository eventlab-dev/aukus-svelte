<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from '$lib/utils.js';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot="textarea"
	class={cn(
		'scrollbar flex field-sizing-content min-h-16 w-full resize-none rounded-lg border-2 border-muted bg-transparent p-2 font-medium transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&:read-only]:focus-visible:ring-0',
		className
	)}
	bind:value
	{...restProps}
></textarea>

<style>
	.scrollbar {
		scrollbar-width: thin;
		scrollbar-color: var(--color-muted-foreground) var(--color-card);
		scrollbar-gutter: stable;
	}
</style>
