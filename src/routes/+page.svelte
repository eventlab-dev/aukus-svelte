<script lang="ts">
	import { fade } from 'svelte/transition'
	import MovesSearch from '$lib/components/MovesSearch.svelte'
	import MoveCard from '$lib/components/moveCard/MoveCard.svelte'
	import TotalViewerCounter from '$lib/components/TotalViewerCounter.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import MoveForm from '$lib/components/moveForm/MoveForm.svelte'
	import MapComponent from '$lib/components/map/MapComponent.svelte'
	import DiceRoller from '$lib/components/moveForm/DiceRoller.svelte'
	import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import DiceAnimationPanel from '$lib/components/diceAnimation/DiceAnimationPanel.svelte'

	const { playersMovesStore, usersStore, eventDataStore } = getAppManagerContext()
	const { moves } = playersMovesStore
	const { myUser } = usersStore
	const { turnState } = eventDataStore

	let filteredMoves: PlayerMoveItem[] = $state([])

	const sortedMovesByDate = $derived.by(getSortedMovesByDate)

	function getSortedMovesByDate() {
		// Helper function to extract date portion from timestamp
		const getDateKey = (timestamp: number) => new Date(timestamp * 1000).toISOString().slice(0, 10)

		// Sort from newest to oldest
		const sortedMoves = filteredMoves.toSorted(
			(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		)

		// Group moves by date
		const movesByDate: Record<string, PlayerMoveItem[]> = {}

		for (const move of sortedMoves) {
			const dateKey = getDateKey(move.created_at)

			if (!movesByDate[dateKey]) {
				movesByDate[dateKey] = []
			}

			movesByDate[dateKey].push(move)
		}

		// Sort dates from newest to oldest
		return Object.entries(movesByDate).toSorted(
			([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()
		)
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString)
		const currentYear = new Date().getFullYear()

		return date.toLocaleString('ru-RU', {
			year: currentYear !== date.getFullYear() ? 'numeric' : undefined,
			month: 'long',
			day: 'numeric'
		})
	}
</script>

<svelte:head>
	<title>Aukus</title>
</svelte:head>

<div class="mt-[100px]">
	<MapComponent />
</div>

{#if $myUser && $turnState === 'filling-form'}
	<div class="sticky bottom-10 mt-10 flex justify-center">
		<MoveForm />
	</div>
{/if}

{#if $myUser && $turnState === 'rolling-dice'}
	<div
		class="fixed top-1/2 left-1/2 w-200 -translate-x-1/2 -translate-y-1/2 rounded bg-transparent"
	>
		<DiceAnimationPanel />
	</div>
	<div class="sticky bottom-10 mt-10 flex justify-center">
		<DiceRoller />
	</div>
{/if}

<div in:fade>
	<div class="mx-auto mt-[30px] flex max-w-[800px] flex-col space-y-3">
		<div class="flex gap-3">
			<MovesSearch moves={$moves} bind:filteredMoves />
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
