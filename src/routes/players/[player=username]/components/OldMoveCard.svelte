<script lang="ts">
	import { Badge, type BadgeVariant } from '$lib/components/ui/badge'
	import type { GameHistoryItem } from '$lib/heyapi/eventlab/types.gen'

	type Props = {
		game: GameHistoryItem
	}

	const { game }: Props = $props()

	const moveTypeStyles = $derived.by(getMoveTypeStyles)

	function getMoveTypeStyles(): { text: string; variant: BadgeVariant } {
		switch (game.completion_status) {
			case 'completed': {
				return { text: 'Пройдено', variant: 'green' }
			}
			case 'drop': {
				return { text: 'Дроп', variant: 'red' }
			}
			case 'reroll': {
				return { text: 'Реролл', variant: 'blue' }
			}
			default: {
				const error: never = game.completion_status
				throw new Error(`Unknown move type: ${error}`)
			}
		}
	}
</script>

<div class="flex w-[800px] flex-col rounded-xl bg-card p-3">
	<div class="flex justify-between">
		<div class="flex gap-1.5">
			<Badge variant={moveTypeStyles.variant}>
				{moveTypeStyles.text}
			</Badge>
		</div>
	</div>

	<div class="mt-3 flex gap-3">
		<div class="space-y-3">
			<div class="text-2xl leading-[29px] font-bold">{game.game_title}</div>
			<div class="font-medium text-muted-foreground">
				{game.review}
			</div>
		</div>
	</div>
</div>
