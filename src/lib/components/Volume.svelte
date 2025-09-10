<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';
	import Volume1 from '@lucide/svelte/icons/volume-1';
	import VolumeX from '@lucide/svelte/icons/volume-x';
	import { Slider } from './ui/slider';
	import { fade } from 'svelte/transition';
	import { Toggle } from './ui/toggle';

	type Props = {
		class?: string;
	};

	const { class: className }: Props = $props();

	const { soundManager } = getAppManagerContext();

	let isVisible = $state(false);

	let timeoutId: number;

	function hide() {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			isVisible = false;
		}, 300);
	}

	function show() {
		clearTimeout(timeoutId);
		isVisible = true;
	}

	function setVolume(value: number) {
		soundManager.setGlobalVolume(value);
	}

	function getVolume() {
		return soundManager.volume;
	}
</script>

<div class="relative">
	{#if isVisible}
		<div class="absolute bottom-full left-1/2 -translate-x-1/2" transition:fade={{ duration: 200 }}>
			<Slider
				id="volume-slider"
				type="single"
				orientation="vertical"
				class="pb-2"
				min={0}
				max={1}
				step={0.01}
				bind:value={getVolume, setVolume}
				onmouseover={show}
				onmouseleave={hide}
			/>
		</div>
	{/if}

	<Toggle
		class={['opacity-70 transition-opacity hover:opacity-100', className]}
		onmouseenter={show}
		onmouseleave={hide}
		onPressedChange={() => soundManager.toggleMute()}
	>
		{#if soundManager.isMuted}
			<VolumeX class="size-8" />
		{:else}
			<Volume1 class="size-8" />
		{/if}
	</Toggle>
</div>
