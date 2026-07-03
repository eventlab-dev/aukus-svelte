<script lang="ts">
	import type { Snippet } from 'svelte'
	import { Button, type ButtonProps } from '../ui/button'

	type Props = {
		selected: boolean
		children: Snippet
	} & ButtonProps

	let { children, selected = $bindable(false), class: className, ...rest }: Props = $props()

	function handleClick() {
		selected = !selected
	}
</script>

<Button
	onclick={handleClick}
	class="data-[selected=false]:bg-secondary data-[selected=true]:bg-primary {className}"
	data-selected={selected}
	{...rest}
>
	{@render children()}
</Button>
