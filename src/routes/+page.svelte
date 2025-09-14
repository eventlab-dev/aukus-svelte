<script lang="ts">
	import type { PlayerMove } from '$lib/api/aukus/types';
	import { fade } from 'svelte/transition';
	import MovesSearch from '$lib/components/MovesSearch.svelte';
	import MoveCard from '$lib/components/moveCard/MoveCard.svelte';
	import TotalViewerCounter from '$lib/components/TotalViewerCounter.svelte';
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';
	import MoveForm from '$lib/components/moveForm/MoveForm.svelte';
	import MapComponent from '$lib/components/map/MapComponent.svelte';

	const { playersMovesStore } = getAppManagerContext();
	const { moves } = playersMovesStore;

	let filteredMoves: PlayerMove[] = $state([]);

	const sortedMovesByDate = $derived.by(getSortedMovesByDate);

	function getSortedMovesByDate() {
		// Helper function to extract date portion from timestamp
		const getDateKey = (timestamp: string) => new Date(timestamp).toISOString().slice(0, 10);

		// Sort from newest to oldest
		const sortedMoves = filteredMoves.toSorted(
			(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		);

		// Group moves by date
		const movesByDate: Record<string, PlayerMove[]> = {};

		for (const move of sortedMoves) {
			const dateKey = getDateKey(move.created_at);

			if (!movesByDate[dateKey]) {
				movesByDate[dateKey] = [];
			}

			movesByDate[dateKey].push(move);
		}

		// Sort dates from newest to oldest
		return Object.entries(movesByDate).toSorted(
			([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()
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

<div class="mt-[100px]">
	<MapComponent />
</div>

<div in:fade>
	<div class="mx-auto mt-[30px] flex max-w-[800px] flex-col space-y-3">
		<MoveForm />

		<div class="flex gap-3">
			<MovesSearch {moves} bind:filteredMoves />
			<TotalViewerCounter />
		</div>
		<div class="space-y-[30px]">
			{#each sortedMovesByDate as [date, moves] (date)}
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
						{#each moves as move (move.id)}
							<MoveCard {move} withUsername />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
