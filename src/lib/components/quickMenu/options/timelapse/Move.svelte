<script lang="ts">
	import { Badge } from '$lib/components/ui/badge'
	import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { getMoveTypeStyles } from '$lib/utils'

	type Props = {
		move: PlayerMoveItem
	}

	const { move }: Props = $props()

	const app = getAppManager()

	const player = $derived(app.playersBySlug.get(move.player_slug))
	const moveTypeStyles = $derived.by(() => getMoveTypeStyles(move.type))
</script>

<div class="space-y-1.5">
	<div class="flex gap-1.5">
		{#if player}
			<Badge variant="secondary" style="background-color: {player.color}">
				{player.username}
			</Badge>
		{/if}
		<Badge variant={moveTypeStyles.variant}>
			{moveTypeStyles.text}
		</Badge>
	</div>
	<div class="mb-[30px] space-y-1.5">
		<div class="text-2xl leading-7 font-semibold">{move.item_title}</div>
		<div class="font-semibold text-muted-foreground">
			Ход на карте — {move.cell_from} -> {move.cell_to}
		</div>
	</div>
</div>
