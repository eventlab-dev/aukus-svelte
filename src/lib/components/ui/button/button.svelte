<script lang="ts" module>
	import Loader from '$lib/components/Loader.svelte'
	import { cn, type WithElementRef } from '$lib/utils.js'
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements'
	import { type VariantProps, tv } from 'tailwind-variants'

	export const buttonVariants = tv({
		base: "aria-invalid:ring-destructive/20 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium outline-none transition-all disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer select-none font-semibold",
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground aria-disabled:bg-muted aria-disabled:text-muted-foreground',
				destructive: 'bg-destructive hover:bg-destructive/90',
				outline: 'bg-background hover:bg-hover border',
				secondary: 'bg-muted hover:bg-hover',
				ghost: 'hover:bg-hover',
				link: 'text-primary underline-offset-4 hover:text-primary underline decoration-2 decoration-primary justify-start',
				social: ''
			},
			size: {
				default: 'h-10 px-4 py-2 has-[>svg]:px-3',
				tiny: "h-6 rounded-[5px] px-2.5 py-[5px] !leading-3.5 text-xs font-bold [&_svg:not([class*='size-'])]:!size-3.5",
				sm: 'h-7 rounded-[5px] text-sm px-2 py-1 has-[>svg]:px-2.5',
				lg: 'h-11 rounded-md px-6 has-[>svg]:px-4',
				icon: 'size-9',
				social: 'h-[34px] w-[122px] py-1.5'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	})

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant']
	export type ButtonSize = VariantProps<typeof buttonVariants>['size']

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant
			size?: ButtonSize
			loading?: boolean
		}
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		loading = false,
		disabled,
		children,
		...restProps
	}: ButtonProps = $props()

	$effect(() => {
		if (loading) {
			disabled = true
		}
	})
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
		{#if loading}
			<Loader class="inline size-6" />
		{/if}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
		{#if loading}
			<Loader class="inline size-6" />
		{/if}
	</button>
{/if}
