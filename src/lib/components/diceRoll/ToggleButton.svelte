<script lang="ts">
	import type { Snippet } from 'svelte'
	import { Button } from '../ui/button'

	type Props = {
		selected: boolean
		children: Snippet
	}

	let { children, selected = $bindable(false) }: Props = $props()

	function handleClick() {
		selected = !selected
	}
</script>

<Button
	onclick={handleClick}
	class="data-[selected=false]:bg-background data-[selected=true]:bg-primary"
	data-selected={selected}
>
	{@render children()}
</Button>
