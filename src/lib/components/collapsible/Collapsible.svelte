<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setCollapsibleContext } from './collapsibleContext';

	type Props = {
		collapsed?: boolean;
		class?: string;
		children: Snippet;
	};

	let { collapsed = $bindable(false), class: className, children }: Props = $props();

	setCollapsibleContext({
		get isCollapsed() {
			return collapsed;
		},
		toggleCollapse,
		open,
		close
	});

	function open() {
		collapsed = false;
	}

	function close() {
		collapsed = true;
	}

	function toggleCollapse() {
		collapsed = !collapsed;
	}
</script>

<div class={['group relative', className]} data-collapsed={collapsed}>
	{@render children()}
</div>
