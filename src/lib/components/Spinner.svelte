<script lang="ts">
	type Props = {
		size?: number;
	};

	const { size = 24 }: Props = $props();
</script>

<div class="flex w-full items-center justify-center">
	<div
		class="h-6 w-6 animate-spin rounded-full border-solid border-t-primary border-r-primary border-b-transparent border-l-transparent"
		style="border-width: {size / 10}px; width: {size}px; height: {size}px;"
	></div>
</div>
