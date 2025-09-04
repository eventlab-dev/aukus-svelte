<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setCollapsibleContext } from './collapsibleContext';

	type Props = {
		collapsed?: boolean | null;
		class?: string;
		children: Snippet;
	};

	let { collapsed = $bindable(null), class: className, children }: Props = $props();

	const context = $state({ isCollapsed: false, toggleCollapse });

	setCollapsibleContext(context);

	$effect(() => {
		if (collapsed !== null) {
			context.isCollapsed = collapsed;
		}
	});

	function toggleCollapse() {
		if (collapsed !== null) {
			collapsed = !collapsed;
			return;
		}

		context.isCollapsed = !context.isCollapsed;
	}
</script>

<div class={['group relative', className]} data-collapsed={context.isCollapsed}>
	{@render children()}
</div>
