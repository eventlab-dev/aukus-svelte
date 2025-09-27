<script lang="ts">
	import type { PlayerMove } from '$lib/api/aukus/types'
	import { Badge } from '$lib/components/ui/badge'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { getMoveTypeStyles } from '$lib/utils'
	import { derived } from 'svelte/store'

	type Props = {
		move: PlayerMove
	}

	const { move }: Props = $props()

	const { playersBySlug } = getAppManagerContext()

	const player = derived(playersBySlug, ($playersBySlug) => $playersBySlug[move.player_slug])
	const moveTypeStyles = $derived.by(() => getMoveTypeStyles(move.type))
</script>

<div class="space-y-1.5">
	<div class="flex gap-1.5">
		{#if $player}
			<Badge variant="secondary" style="background-color: {$player.color}">
				{$player.username}
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
