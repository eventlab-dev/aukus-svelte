<script lang="ts">
	import { Button } from './ui/button'
	import { ScrollArea } from './ui/scroll-area'
	import type { Snippet } from 'svelte'
	import { PAGE_BG, PAGE_SCROLL_ID } from '$lib/constants'
	import Arrow from './icons/new/Arrow.svelte'

	type Props = {
		bottomSpace?: boolean
		children?: Snippet
		class?: string
		style?: string
	}

	const defaultStyle = `background-image: url('${PAGE_BG}'); background-size: cover;`

	let { bottomSpace = true, children, class: className = "", style = defaultStyle }: Props = $props()
</script>

<div 
class="fixed w-full h-screen top-0 z-20 flex items-center justify-center bg-black/90 overflow-auto {className}" 
style={style}
>
	<ScrollArea class="h-full w-full" id={PAGE_SCROLL_ID}>
		{@render children?.()}
		{#if bottomSpace}
			<div class="h-60"></div>
		{/if}
	</ScrollArea>
	<div class="absolute top-2 left-2">
		<Button class="h-[34px] w-[178px] rounded-[18px] font-extrabold" href="/">
			<Arrow /> ЗАКРЫТЬ
		</Button>
	</div>
</div>