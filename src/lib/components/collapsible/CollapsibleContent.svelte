<script lang="ts">
	import type { Snippet } from 'svelte'
	import { getCollapsibleContext } from './collapsibleContext'

	type Props = {
		class?: string
		children: Snippet
	}

	const { class: className, children }: Props = $props()

	const collapsible = getCollapsibleContext()
	const minCollapsedHeight = 6

	let height = $state(0)
	let contentRef: HTMLDivElement | null = $state(null)

	$effect(() => {
		if (contentRef) {
			// hack to prevent "justify-content: end" affecting height calculation
			contentRef.style.display = 'block'
			height = !collapsible.isCollapsed ? contentRef.scrollHeight : minCollapsedHeight
			contentRef.style.display = 'flex'
		}
	})
</script>

<div
	bind:this={contentRef}
	style="height: {height}px;"
	class={[
		'z-[-1] mx-auto flex w-full flex-col justify-end space-y-[3px] overflow-hidden transition-[opacity,scale,height] duration-300 group-data-[collapsed=true]:pointer-events-none group-data-[collapsed=true]:scale-x-95 group-data-[collapsed=true]:opacity-75',
		className
	]}
>
	{@render children()}
</div>
