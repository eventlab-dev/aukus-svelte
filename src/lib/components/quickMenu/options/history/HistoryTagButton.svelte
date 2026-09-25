<script lang="ts">
	import type { Snippet } from 'svelte'
	import { cn } from '$lib/utils.js'
	import DashedBorder from '$lib/components/DashedBorder.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	// Кнопка-тег для истории: вид как у TabsTrigger, активный подсвечен
	// круглым пунктиром через мерный DashedBorder
	type Props = {
		active?: boolean
		onclick?: (e: MouseEvent) => void
		class?: string
		children: Snippet
	}

	const { active = false, onclick, class: className = '', children }: Props = $props()

	const app = getAppManager()

	let btn: HTMLElement | null = $state(null)

	function handleClick(e: MouseEvent) {
		app.soundManager.playUi('ui-select', { volume: 0.4 })
		onclick?.(e)
	}
</script>

<button
	bind:this={btn}
	type="button"
	data-active={active}
	onclick={handleClick}
	class={cn(
		'relative inline-flex h-[43px] max-w-fit flex-1 cursor-pointer items-center justify-center gap-1 rounded-[18px] bg-secondary px-4 py-1 font-extrabold whitespace-nowrap text-foreground transition-[color,box-shadow] data-[active=true]:bg-primary data-[active=true]:shadow-none data-[active=false]:text-ice-border [&_svg]:pointer-events-none [&_svg]:shrink-0',
		className
	)}
>
	{#if active}
		<span aria-hidden="true">{'>'}</span>
	{/if}
	{@render children()}
	{#if active}
		<span aria-hidden="true">{'<'}</span>
		<DashedBorder anchor={btn} radius={18} />
	{/if}
</button>
