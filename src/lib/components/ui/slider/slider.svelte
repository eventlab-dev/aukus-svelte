<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		orientation = 'horizontal',
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SliderPrimitive.RootProps> = $props();
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<SliderPrimitive.Root
	bind:ref
	bind:value={value as never}
	data-slot="slider"
	{orientation}
	class={cn(
		'group relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-fit data-[orientation=vertical]:flex-col',
		className
	)}
	thumbPositioning="contain"
	trackPadding={4}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-orientation={orientation}
			data-slot="slider-track"
			class={cn(
				'relative grow cursor-pointer overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-3 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-3'
			)}
		>
			<SliderPrimitive.Range
				data-slot="slider-range"
				class={cn(
					'absolute rounded-full bg-foreground transition-colors group-hover:bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full'
				)}
			/>
		</span>
		{#each thumbItems as thumb (thumb.index)}
			<SliderPrimitive.Thumb
				data-slot="slider-thumb"
				index={thumb.index}
				class="block size-5.5 shrink-0 cursor-pointer rounded-full border-3 border-primary bg-primary opacity-0 ring-ring/50 transition-[color,box-shadow,opacity] group-hover:opacity-100 hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
			/>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
