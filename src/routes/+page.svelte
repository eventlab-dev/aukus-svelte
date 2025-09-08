<script lang="ts">
	import PlayerCard from '$lib/components/player/PlayerCard.svelte';
	import { flip } from 'svelte/animate';
	import type { PlayerMove } from '$lib/api/aukus/types';
	import { fade } from 'svelte/transition';
	import MovesSearch from '$lib/components/MovesSearch.svelte';
	import MoveCard from '$lib/components/moveCard/MoveCard.svelte';
	import QuickMenu from '$lib/components/quickMenu/QuickMenu.svelte';
	import TotalViewerCounter from '$lib/components/TotalViewerCounter.svelte';
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import MoveForm from '$lib/components/moveForm/MoveForm.svelte';
	import { Button } from '$lib/components/ui/button';

	const { playersStore, playersMovesStore } = getAppManagerContext();
	const { moves } = playersMovesStore;

	let filteredMoves: PlayerMove[] = $state([]);

	const sortedPlayers = $derived(
		playersStore.players.toSorted((a, b) => b.total_score - a.total_score)
	);
	const sortedMovesByDate = $derived.by(getMovesByDate);

	function getMovesByDate() {
		const movesByDate = filteredMoves.reduce(
			(acc, move) => {
				const date = move.created_at;
				acc[date] = [...(acc[date] || []), move];

				return acc;
			},
			{} as Record<string, PlayerMove[]>
		);

		return Object.fromEntries(
			Object.entries(movesByDate).toSorted((a, b) => {
				const dateA = new Date(a[0]).getTime();
				const dateB = new Date(b[0]).getTime();

				return dateB - dateA;
			})
		);
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const currentYear = new Date().getFullYear();

		return date.toLocaleString('ru-RU', {
			year: currentYear !== date.getFullYear() ? 'numeric' : undefined,
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Aukus</title>
</svelte:head>

<div in:fade>
	<div class="absolute top-2.5 left-2.5 z-10">
		<QuickMenu />
	</div>

	<div class="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5">
		{#each sortedPlayers as player (player.id)}
			<div animate:flip>
				<PlayerCard {player} />
			</div>
		{/each}
	</div>

	<div class="mx-auto mt-[30px] flex max-w-[800px] flex-col space-y-3">
		<MoveForm />

		<div class="flex gap-3">
			<MovesSearch {moves} bind:filteredMoves />
			<TotalViewerCounter />
		</div>
		<div class="space-y-[30px]">
			{#each Object.entries(sortedMovesByDate) as [date, moves] (date)}
				{@const today = new Date()}
				{@const isToday =
					today.getFullYear() === new Date(date).getFullYear() &&
					today.getMonth() === new Date(date).getMonth() &&
					today.getDate() === new Date(date).getDate()}

				<div class="space-y-5">
					{#if !isToday}
						<div class="text-center text-2xl font-semibold">{formatDate(date)}</div>
					{/if}
					<div class="space-y-3">
						{#each moves as move}
							<MoveCard {move} withUsername />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
