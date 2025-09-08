<script lang="ts">
	import type { PlayerMove } from '$lib/api/aukus/types';
	import SearchIcon from '$lib/components/icons/SearchIcon.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { transliterateRussianToEnglishVariants } from '$lib/utils';

	type Props = {
		moves: PlayerMove[];
		filteredMoves: PlayerMove[];
	};

	let { moves, filteredMoves = $bindable([]) }: Props = $props();

	let value = $state('');

	const translitFilter = $derived.by(() =>
		transliterateRussianToEnglishVariants(value.toLowerCase())
	);

	$effect(() => {
		filteredMoves = moves.filter((move) => {
			return translitFilter.some((ftext) => move.item_title.toLowerCase().includes(ftext));
		});
	});
</script>

<div class="relative w-full">
	<SearchIcon class="absolute top-1/2 left-3 size-[19px] -translate-y-1/2 text-muted-foreground" />
	<Input
		id="moves-search"
		class="w-full pl-[43px]"
		type="text"
		placeholder="Поиск среди игр всех аукусов"
		bind:value
	/>
</div>
