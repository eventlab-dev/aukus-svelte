<script lang="ts">
	import LifebuoyIcon from '$lib/components/icons/LifebuoyIcon.svelte'
	import { Button } from '$lib/components/ui/button'
	import { Dialog, DialogClose, DialogContent, DialogTrigger } from '$lib/components/ui/dialog'
	import Wheel, { type WheelEntry } from '$lib/components/wheel/Wheel.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import X from '@lucide/svelte/icons/x'
	import Volume from '$lib/components/Volume.svelte'

	type EntriesType = 'moment' | 'difficulty'

	const difficulty: WheelEntry[] = [
		{ id: 1, label: 'Легкая', color: '#34C759', weight: 0.5 },
		{ id: 3, label: 'Нормальная', color: '#5856D6', weight: 8 },
		{ id: 4, label: 'Сложная', color: '#E58600', weight: 1 },
		{ id: 2, label: 'Очень сложная', color: '#FF3B30', weight: 0.5 }
	]
	const moment: WheelEntry[] = [
		{ id: 1, label: 'Дроп', color: '#FF3B30', weight: 0.5 },
		{ id: 2, label: 'Не дроп', color: '#34C759', weight: 0.5 }
	]

	const { soundManager } = getAppManagerContext()

	let currentType: EntriesType = $state('difficulty')

	const isMomentType = $derived((currentType as EntriesType) === 'moment')
	const currentEntries = $derived(isMomentType ? moment : difficulty)

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _ = currentType
		soundManager.stop()
	})

	function changeEntries(type: EntriesType) {
		currentType = type
	}

	function onSpinStart(delay: number) {
		setTimeout(() => {
			soundManager.playRandom({ fadeIn: 1, loop: true })
		}, delay)
	}

	function onSpinEnd() {
		soundManager.stop()
	}

	function onOpenChange(open: boolean) {
		if (!open) {
			soundManager.stop()
		}
	}
</script>

<Dialog {onOpenChange}>
	<DialogTrigger>
		<LifebuoyIcon /> Колёса вариантов
	</DialogTrigger>
	<DialogContent
		class="bg-unset top-0 bottom-0 mt-15 h-full w-full -translate-x-1/2 translate-y-0 items-center px-[90px]"
		showCloseButton={false}
	>
		<div class="absolute top-3 left-1/2 flex -translate-x-1/2 gap-3">
			<Button
				variant={!isMomentType ? 'default' : 'secondary'}
				size="sm"
				class="h-8 shrink rounded-lg px-[50px] py-2 text-sm font-bold"
				onclick={() => changeEntries('difficulty')}
			>
				Колесо сложности
			</Button>
			<Button
				variant={isMomentType ? 'default' : 'secondary'}
				size="sm"
				class="h-8 shrink rounded-lg px-[50px] py-2 text-sm font-bold"
				onclick={() => changeEntries('moment')}
			>
				Колесо шейх-момента
			</Button>
		</div>

		<div class="relative">
			{#key currentType}
				<Wheel entries={currentEntries} size={564} {onSpinStart} {onSpinEnd} />
			{/key}

			<div class="absolute bottom-0 left-[calc(100%_+_2.5rem)] z-50">
				<Volume />
			</div>
		</div>

		<DialogClose
			class="absolute top-3 right-3 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
		>
			<X class="size-8 stroke-4" />
		</DialogClose>
	</DialogContent>
</Dialog>
