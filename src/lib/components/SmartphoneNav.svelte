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
	import SkinEditorDialog from './skinEditor/SkinEditorDialog.svelte'

	type AppItem = {
		id: string
		icon: import('svelte').Component
		label: string
		page?: AppPage
	}

	const apps: AppItem[] = [
		{ id: 'rules', icon: RulesIcon, label: 'Правила', page: 'rules' },
		{ id: 'stats', icon: StatsIcon, label: 'Статистика', page: 'stats' },
		{ id: 'achievements', icon: Trophy, label: 'Ачивки', page: 'achievements' },
		{ id: 'history', icon: History, label: 'История', page: 'history' },
		{ id: 'streams', icon: TV, label: 'Стримы', page: 'streams' },
		{ id: 'subs', icon: ShieldX, label: 'Подсеры' },
		{ id: 'skins', icon: Shirt, label: 'Одежда' },
		{ id: 'wheels', icon: ShipWheel, label: 'Колеса', page: 'wheels' },
		{ id: 'calculator', icon: Calculator, label: 'Калькулятор', page: 'calculator' },
		{ id: 'about', icon: DevelopersIcon, label: 'Создатели', page: 'about' },
		{ id: 'login', icon: ProfileIcon, label: 'Логин', page: 'login' }
	]

	function togglePhone() {
		isOpen = !isOpen
	}
</script>

<div class="fixed bottom-4 left-4 z-50">
	{#if isOpen}
		<div
			class="mb-3 h-[542px] w-[320px] rounded-[52px] border-8 border-[#B6E1FF] bg-[#40A3D8]/40 shadow-2xl backdrop-blur-lg"
			transition:fly={{ duration: 300, y: 20 }}
		>
			<div class="flex w-full justify-center">
				<div class="h-[20px] w-[108px] rounded-b-[12px] bg-[#B6E1FF]"></div>
			</div>
			<div class="mt-[60px] w-full text-center text-2xl font-bold">Привет!</div>
			<div class="grid grid-cols-3 gap-3 p-6">
				{#each apps as appItem (appItem.label)}
					{@const Icon = appItem.icon}
					{#if appItem.id === 'skins'}
						{#if app.myUser}
							<SkinEditorDialog>
								<button class="flex cursor-pointer flex-col items-center rounded-2xl transition-colors hover:bg-blue-500/20">
									<Icon class="mb-[2px] h-[80px] w-[80px] text-blue-400" />
									<span class="text-xs text-card-blue-foreground">{appItem.label}</span>
								</button>
							</SkinEditorDialog>
						{/if}
					{:else}
						<button
							class="flex cursor-pointer flex-col items-center rounded-2xl transition-colors hover:bg-blue-500/20"
							onclick={() => {
								if (appItem.page) {
									navStore.changePage(appItem.page)
								}
								isOpen = false
							}}
						>
							<Icon class="mb-[2px] h-[80px] w-[80px] text-blue-400" />
							<span class="text-xs text-card-blue-foreground">{appItem.label}</span>
						</button>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<Button
		onclick={togglePhone}
		aria-label="Toggle navigation menu"
		class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:scale-105 hover:bg-blue-600"
	>
		<Smartphone />
	</Button>
</div>
