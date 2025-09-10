<script lang="ts">
	import LifebuoyIcon from '$lib/components/icons/LifebuoyIcon.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogClose, DialogContent, DialogTrigger } from '$lib/components/ui/dialog';
	import Wheel, { type WheelEntry } from '$lib/components/wheel/Wheel.svelte';
	import X from '@lucide/svelte/icons/x';

	type EntriesType = 'moment' | 'difficulty';

	const difficulty: WheelEntry[] = [
		{ id: 1, label: 'Легкая', color: '#34C759', weight: 0.5 },
		{ id: 3, label: 'Нормальная', color: '#5856D6', weight: 8 },
		{ id: 4, label: 'Сложная', color: '#E58600', weight: 1 },
		{ id: 2, label: 'Очень сложная', color: '#FF3B30', weight: 0.5 }
	];
	const moment: WheelEntry[] = [
		{ id: 1, label: 'Дроп', color: '#FF3B30', weight: 0.5 },
		{ id: 2, label: 'Не дроп', color: '#34C759', weight: 0.5 }
	];

	let currentType: EntriesType = $state('difficulty');

	const isMomentType = $derived((currentType as EntriesType) === 'moment');
	const currentEntries = $derived(isMomentType ? moment : difficulty);

	function changeEntries(type: EntriesType) {
		currentType = type;
	}
</script>

<Dialog>
	<DialogTrigger>
		<LifebuoyIcon /> Колёса вариантов
	</DialogTrigger>
	<DialogContent class="bg-unset h-full w-full items-center px-[90px]" showCloseButton={false}>
		<div class="absolute top-2.5 left-1/2 flex -translate-x-1/2 gap-3">
			<Button
				variant={!isMomentType ? 'default' : 'secondary'}
				class="w-[232px] shrink"
				onclick={() => changeEntries('difficulty')}>Колесо сложности</Button
			>
			<Button
				variant={isMomentType ? 'default' : 'secondary'}
				class="w-[258px] shrink"
				onclick={() => changeEntries('moment')}>Колесо шейх-момента</Button
			>
		</div>

		{#key currentType}
			<Wheel entries={currentEntries} size={564} />
		{/key}

		<DialogClose
			class="absolute top-3.5 right-3 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
		>
			<X class="size-8 stroke-4" />
		</DialogClose>
	</DialogContent>
</Dialog>
