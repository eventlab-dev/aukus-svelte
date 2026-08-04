<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'aria-invalid:ring-destructive/20 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-lg px-2.5 py-[5px] !leading-3.5 text-xs font-extrabold transition-[color,box-shadow] [&>svg]:pointer-events-none [&>svg]:size-3',
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground',
				secondary: 'bg-muted',
				destructive: 'bg-destructive text-white',
				outline: 'text-foreground border',
				green: 'bg-custom-green',
				red: 'bg-custom-red',
				blue: 'bg-custom-blue',
				orange: 'bg-custom-orange',
				white: 'bg-foreground text-primary'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = 'default',
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
