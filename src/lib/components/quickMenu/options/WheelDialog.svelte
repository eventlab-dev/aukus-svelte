<script lang="ts">
	import LifebuoyIcon from '$lib/components/icons/LifebuoyIcon.svelte'
	import { Button } from '$lib/components/ui/button'
	import { Dialog, DialogClose, DialogContent, DialogTrigger } from '$lib/components/ui/dialog'
	import Wheel, { type WheelEntry } from '$lib/components/wheel/Wheel.svelte'
	import X from '@lucide/svelte/icons/x'
	import Volume from '$lib/components/Volume.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

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

	const app = getAppManager()
	const { soundManager } = app

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
			app.navStore.closePage()
		}
	}
</script>

<Dialog {onOpenChange} open>
	<DialogTrigger>
		<LifebuoyIcon /> Колёса
	</DialogTrigger>
	<DialogContent showCloseButton={false} class="bg-unset max-w-[850px]! shadow-none">
		<div class="top-3 flex justify-center gap-3">
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

		<div class="relative mt-30">
			{#key currentType}
				<Wheel entries={currentEntries} size={564} {onSpinStart} {onSpinEnd} />
			{/key}

			<div class="absolute bottom-[40px] left-[calc(100%_-_5rem)] z-50">
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
