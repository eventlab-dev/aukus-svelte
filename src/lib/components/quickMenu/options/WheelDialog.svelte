<script lang="ts">
	import LifebuoyIcon from '$lib/components/icons/LifebuoyIcon.svelte'
	import { Button } from '$lib/components/ui/button'
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
	import PageContainer from '$lib/components/PageContainer.svelte'
	import Wheel, { type WheelEntry } from '$lib/components/wheel/Wheel.svelte'
	import Volume from '$lib/components/Volume.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

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
	const { soundManager, navStore } = app

	let currentType = $state('difficulty')

	const currentEntries = $derived(currentType === 'moment' ? moment : difficulty)

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _ = currentType
		soundManager.stop()
	})

	function onSpinStart(delay: number) {
		setTimeout(() => {
			soundManager.playRandom({ fadeIn: 1, loop: true })
		}, delay)
	}

	function onSpinEnd() {
		soundManager.stop()
	}

	function openWheels() {
		navStore.navigate('/wheels')
	}
</script>

<Button onclick={openWheels}>
	<LifebuoyIcon /> Колёса
</Button>

<PageContainer bottomSpace={false}>
	<div class="flex flex-col items-center pt-16">
		<div class="top-3 flex justify-center gap-3">
			<Tabs value={currentType} onValueChange={(v) => (currentType = v)}>
				<TabsList class="flex flex-wrap gap-2">
					<TabsTrigger value="difficulty" class="px-[50px] py-2 text-sm font-bold">
						Колесо сложности
					</TabsTrigger>
					<TabsTrigger value="moment" class="px-[50px] py-2 text-sm font-bold">
						Колесо шейх-момента
					</TabsTrigger>
				</TabsList>
			</Tabs>
		</div>

		<div class="relative mt-30">
			{#key currentType}
				<Wheel entries={currentEntries} size={564} {onSpinStart} {onSpinEnd} />
			{/key}

			<div class="absolute bottom-[40px] left-[calc(100%_-_5rem)] z-50">
				<Volume />
			</div>
		</div>
	</div>
</PageContainer>
