<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		children: Snippet;
	};

	const { class: className, children }: Props = $props();
</script>

<div
	class={[
		'flex w-full shrink-0 flex-col items-center gap-[1px] overflow-hidden rounded-lg bg-muted first:mt-[3px] [&>*]:flex [&>*]:h-auto [&>*]:w-full [&>*]:items-center [&>*]:justify-start [&>*]:gap-2.5 [&>*]:rounded-none [&>*]:border-none [&>*]:bg-card [&>*]:p-2.5 [&>*]:leading-normal [&>*]:font-semibold [&>*]:select-none [&>*]:hover:bg-hover [&>*]:[&>svg]:size-[19px]',
		className
	]}
>
	{@render children()}
</div>
