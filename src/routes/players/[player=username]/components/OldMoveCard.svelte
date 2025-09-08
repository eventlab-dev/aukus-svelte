<script lang="ts">
	import type { PreviousGame } from '$lib/api/aukus/types';
	import { Badge, type BadgeVariant } from '$lib/components/ui/badge';

	type Props = {
		move: PreviousGame;
	};

	const { move }: Props = $props();

	const moveTypeStyles = $derived.by(getMoveTypeStyles);

	function getMoveTypeStyles(): { text: string; variant: BadgeVariant } {
		switch (move.status) {
			case 'completed': {
				return { text: 'Пройдено', variant: 'green' };
			}
			case 'drop': {
				return { text: 'Дроп', variant: 'red' };
			}
			case 'reroll': {
				return { text: 'Реролл', variant: 'blue' };
			}
			case 'movie': {
				return { text: 'Кино', variant: 'default' };
			}
			default: {
				return { text: 'Ошибка', variant: 'default' };
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
			<div class="text-2xl leading-[29px] font-bold">{move.title}</div>
			<div class="font-medium text-muted-foreground">
				{move.review}
			</div>
		</div>
	</div>
</div>
