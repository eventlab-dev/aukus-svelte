<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';

	const { playersStore } = getAppManagerContext();
	const totalViewerCounter = $derived.by(getTotalViewerCounter);

	function getTotalViewerCounter() {
		return playersStore.players.reduce((prev, curr) => prev + (curr.online_count || 0), 0);
	}
</script>

<div class="shrink-0 rounded-lg bg-card p-2.5 font-medium text-muted-foreground">
	Общий онлайн: {totalViewerCounter}
</div>
