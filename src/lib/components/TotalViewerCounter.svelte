<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { players } = getAppManagerContext()

	const totalViewers = $derived(players.map((p) => p.online_count).reduce((a, b) => a + b, 0))
</script>

<div class="shrink-0 rounded-lg bg-card p-2.5 font-medium text-muted-foreground">
	Общий онлайн: {totalViewers}
</div>
