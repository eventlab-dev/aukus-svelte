<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ImageLoader from '$lib/components/ImageLoader.svelte';
	import { Input } from '$lib/components/ui/input';
	import { FALLBACK_GAME_POSTER } from '$lib/constants';
	import { debounce } from '$lib/utils';
	import X from '@lucide/svelte/icons/x';
	import { fade, slide } from 'svelte/transition';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import { onMount } from 'svelte';
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';

	type Props = {
		value: string;
	};

	let { value = $bindable('') }: Props = $props();

	const { myPlayer } = getAppManagerContext();

	const searchResults = $derived(
		value === ''
			? []
			: [
					{ id: '1', name: 'Game 1', release_year: 1, cover: FALLBACK_GAME_POSTER },
					{ id: '2', name: 'Game 2', release_year: 1, cover: FALLBACK_GAME_POSTER },
					{ id: '3', name: 'Game 3', release_year: 1, cover: FALLBACK_GAME_POSTER },
					{ id: '4', name: 'Game 4', release_year: 1, cover: FALLBACK_GAME_POSTER },
					{ id: '5', name: 'Game 5', release_year: 1, cover: FALLBACK_GAME_POSTER }
				].filter((game) => game.name.toLowerCase().includes(value.toLowerCase()))
	);

	let isSearching = $state(false);
	let isFocused = $state(false);
	let inputRef: HTMLInputElement | null = $state(null);

	onMount(() => {
		if (myPlayer) {
			value = myPlayer.current_game || '';
		}
	});

	const debouncedInput = debounce((val: string) => {
		value = val;
	}, 400);

	function onGameClick(gameTitle: string) {
		value = gameTitle;
	}

	function onblur() {
		isFocused = false;
	}

	function onfocus() {
		isFocused = true;
	}
</script>

<div class="relative">
	<Input
		bind:ref={inputRef}
		id="game-title"
		type="text"
		class="bg-muted"
		placeholder="Введите название игры"
		{value}
		{onfocus}
		{onblur}
		oninput={(e) => debouncedInput(e.currentTarget.value)}
	/>

	{#if (searchResults.length > 0 || isSearching) && isFocused}
		<div
			class="absolute top-full z-50 mt-1 flex max-h-60 w-full overflow-hidden rounded-lg bg-muted"
			transition:slide={{ duration: 200 }}
		>
			{#if isSearching}
				<div class="flex items-center justify-center p-4">
					<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
					Поиск...
				</div>
			{:else if searchResults.length > 0}
				<ScrollArea class="h-auto flex-1 overflow-hidden">
					<div>
						{#each searchResults as game}
							<Button
								variant="secondary"
								class="bg-unset h-auto w-full justify-start gap-3 rounded-none p-2 text-start hover:bg-hover"
								onmousedown={(e) => onGameClick(game.name)}
							>
								<ImageLoader
									src={game.cover || FALLBACK_GAME_POSTER}
									alt={game.name}
									class="h-14 w-10 overflow-hidden rounded"
								/>
								<div class="">
									<div class="font-semibold">{game.name}</div>
									<div class="text-sm">{game.release_year}</div>
								</div>
							</Button>
						{/each}
					</div>
				</ScrollArea>
			{/if}
		</div>
	{/if}

	{#if value}
		<div class="absolute top-1/2 right-2 -translate-y-1/2" in:fade={{ duration: 200 }}>
			<Button
				variant="ghost"
				size="icon"
				class="bg-unset hover:bg-unset rounded-full opacity-70 hover:opacity-100"
				onclick={() => (value = '')}
			>
				<X class="size-4 stroke-3" />
			</Button>
		</div>
	{/if}
</div>
