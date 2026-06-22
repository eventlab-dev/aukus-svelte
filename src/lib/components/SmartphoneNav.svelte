<script lang="ts">
	import MapIcon from './icons/new/MapIcon.svelte'
	import StatsIcon from './icons/new/StatsIcon.svelte'
	import RulesIcon from './icons/new/RulesIcon.svelte'
	import DevelopersIcon from './icons/new/DevelopersIcon.svelte'
	import { fly } from 'svelte/transition'
	import Smartphone from '@lucide/svelte/icons/smartphone'
	import TV from '@lucide/svelte/icons/tv'
	import ShieldX from '@lucide/svelte/icons/shield-x'
	import Shirt from '@lucide/svelte/icons/shirt'
	import ShipWheel from '@lucide/svelte/icons/ship-wheel'
	import Calculator from '@lucide/svelte/icons/calculator'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	let isOpen = $state(false)

	const app = getAppManager()
	const { navStore } = app

	import Trophy from '@lucide/svelte/icons/trophy'
	import History from '@lucide/svelte/icons/history'
	import { Button } from './ui/button'
	import type { AppPage } from '$lib/stores/NavStore.svelte'
	import ProfileIcon from './icons/ProfileIcon.svelte'

	type AppItem = {
		icon: import('svelte').Component
		label: string
		page?: AppPage
		onclick?: () => void
	}

	const apps: AppItem[] = [
		{ icon: RulesIcon, label: 'Правила', page: 'rules' },
		{ icon: StatsIcon, label: 'Статистика', page: 'stats' },
		{ icon: Trophy, label: 'Ачивки'},
		{ icon: History, label: 'История' },
		{ icon: TV, label: 'Мультистрим', page: 'multistream' },
		{ icon: ShieldX, label: 'Подсеры' },
		{ icon: Shirt, label: 'Одежда' },
		{ icon: ShipWheel, label: 'Колеса', page: 'wheels' },
		{ icon: Calculator, label: 'Калькулятор', page: 'calculator' },
		{ icon: DevelopersIcon, label: 'Создатели', page: 'about' },
		{ icon: ProfileIcon, label: 'Логин', page: 'login' },
	]

	function togglePhone() {
		isOpen = !isOpen
	}
</script>

<div class="fixed bottom-4 left-4 z-50">
	{#if isOpen}
		<div
			class="h-[542px] w-[320px] mb-3 border-8 border-[#B6E1FF] bg-[#40A3D8]/40 shadow-2xl backdrop-blur-lg rounded-[52px]"
			transition:fly={{ duration: 300, y: 20 }}
		>
		<div class="flex justify-center w-full">
			<div class="w-[108px] h-[20px] rounded-b-[12px] bg-[#B6E1FF]"></div>
		</div>
		<div class="w-full text-center text-2xl font-bold mt-[60px]">Привет!</div>
			<div class="grid grid-cols-3 gap-3 p-6">
				{#each apps as app (app.label)}
					{@const Icon = app.icon}
					<button
						class="flex flex-col items-center rounded-2xl transition-colors cursor-pointer hover:bg-blue-500/20"
						onclick={() => {
							if (app.page) {
								navStore.changePage(app.page)
							}
							isOpen = false
						}}
					>
						<Icon class="mb-[2px] h-[80px] w-[80px] text-blue-400" />
						<span class="text-xs text-card-blue-foreground">{app.label}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<Button
		onclick={togglePhone}
		aria-label="Toggle navigation menu"
		class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105"
	>
		<Smartphone />
	</Button>
</div>
