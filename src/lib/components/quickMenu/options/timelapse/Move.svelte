<script lang="ts">
	import type { PlayerMove } from '$lib/api/aukus/types';
	import { Badge } from '$lib/components/ui/badge';
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';
	import { getPlayerColor } from '$lib/types';
	import { getMoveTypeStyles } from '$lib/utils';

	type Props = {
		move: PlayerMove;
	};

	const { move }: Props = $props();

	const { playersStore } = getAppManagerContext();

	const player = $derived.by(() => playersStore.getPlayer(move.player_id));
	const moveTypeStyles = $derived.by(() => getMoveTypeStyles(move.type));
</script>

<div class="space-y-1.5">
	<div class="flex gap-1.5">
		{#if player}
			<Badge variant="secondary" style="background-color: {getPlayerColor(player.url_handle)}">
				{player.name}
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
