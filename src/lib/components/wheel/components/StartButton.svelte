<script lang="ts">
	import SnowflakeIcon from '$lib/components/icons/SnowflakeIcon.svelte';
	import { Button } from '$lib/components/ui/button';
	import { scale } from 'svelte/transition';

	type Props = {
		isSpinning: boolean;
		textSize: number;
		buttonSize: number;
		strokeColor: string;
		borderWidth: number;
		onclick: () => void;
	};

	const { isSpinning, textSize, buttonSize, strokeColor, borderWidth, onclick }: Props = $props();
</script>

<Button
	variant={isSpinning ? 'secondary' : 'default'}
	class="rounded-full text-sm whitespace-normal transition-colors disabled:opacity-100"
	style="font-size: {textSize}px; line-height: {textSize +
		2}px; border: {borderWidth}px solid {strokeColor}; width: {buttonSize}px; height: {buttonSize}px;"
	disabled={isSpinning}
	{onclick}
>
	<div class="grid h-full w-full place-items-center">
		{#if isSpinning}
			<div class="col-start-1 row-start-1" transition:scale={{ opacity: 0, start: 0.5 }}>
				<SnowflakeIcon class="size-12" />
			</div>
		{:else}
			<div class="col-start-1 row-start-1" transition:scale={{ opacity: 0, start: 0.5 }}>
				Крутить
			</div>
		{/if}
	</div>
</Button>
