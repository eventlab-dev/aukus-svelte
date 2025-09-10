<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	export const toggleVariants = tv({
		base: "aria-invalid:ring-destructive/20 aria-invalid:border-destructive inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer",
		variants: {
			variant: {
				default: 'bg-transparent',
				secondary: 'bg-muted text-muted-foreground hover:text-foreground',
				outline: 'border-input hover:bg-accent hover:text-accent-foreground border bg-transparent',
				white: 'bg-foreground text-primary',
				primary: 'bg-primary text-primary-foreground hover:bg-primary/90'
			},
			size: {
				default: 'h-9 min-w-9 px-2',
				tiny: "rounded-[5px] px-2.5 py-[5px] !leading-3.5 text-xs font-bold [&_svg:not([class*='size-'])]:!size-3.5",
				sm: 'h-7 rounded-[5px] text-sm px-2 py-[5px] has-[>svg]:px-2.5',
				lg: 'h-10 min-w-10 px-2.5'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ToggleVariant = VariantProps<typeof toggleVariants>['variant'];
	export type ToggleSize = VariantProps<typeof toggleVariants>['size'];
	export type ToggleVariants = VariantProps<typeof toggleVariants>;
</script>

<script lang="ts">
	import { Toggle as TogglePrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		pressed = $bindable(false),
		class: className,
		size = 'default',
		variant = 'default',
		...restProps
	}: TogglePrimitive.RootProps & {
		variant?: ToggleVariant;
		size?: ToggleSize;
	} = $props();
</script>

<TogglePrimitive.Root
	bind:ref
	bind:pressed
	data-slot="toggle"
	class={cn(toggleVariants({ variant, size }), className)}
	{...restProps}
/>
