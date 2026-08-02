<script lang="ts">
	import { GameHistoryStore } from '$lib/stores/GamesHistoryStore.svelte'
	import Loader from '../Loader.svelte'
	import TierList from './TierList.svelte'

	type Props = {
		playerSlug: string
		event: string
	}

	let { playerSlug, event }: Props = $props()

	const historyStore = new GameHistoryStore({
		getPlayers: () => []
	})

	historyStore.searchParams = {
		events: [event],
		players: [playerSlug]
	}
</script>

{#if historyStore.historyQuery.isPending || true}
	<div class="flex justify-center my-10">
		<Loader class="inline size-20" />
	</div>
{:else}
	<TierList games={historyStore.gamesHistoryByEvent.get(event) || []} />
{/if}
