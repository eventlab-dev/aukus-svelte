<script lang="ts">
	import MapIcon from './icons/new/MapIcon.svelte'
	import StatsIcon from './icons/new/StatsIcon.svelte'
	import RulesIcon from './icons/new/RulesIcon.svelte'
	import DevelopersIcon from './icons/new/DevelopersIcon.svelte'
	import { fly } from 'svelte/transition'
	import Smartphone from '@lucide/svelte/icons/smartphone'
	import TV from '@lucide/svelte/icons/tv'
	import ShieldX from '@lucide/svelte/icons/shield-x'
	import ShipWheel from '@lucide/svelte/icons/ship-wheel'
	import Calculator from '@lucide/svelte/icons/calculator'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	let isOpen = $state(false)

	const app = getAppManager()
	const { navStore } = app

	import Trophy from '@lucide/svelte/icons/trophy'
	import History from '@lucide/svelte/icons/history'
	import { Button } from './ui/button'
	import SkinEditorDialog from './skinEditor/SkinEditorDialog.svelte'
	import ShitDialog from './shitKick/ShitDialog.svelte'
	import type { AppUrl } from '$lib/stores/NavStore.svelte'
	import MoveForm from './moveForm/MoveForm.svelte'
	import { PHONE_BG } from '$lib/constants'

	type AppItem = {
		id: string
		icon: import('svelte').Component
		label: string
		url?: AppUrl
	}

	const apps: AppItem[] = [
		{ id: 'rules', icon: RulesIcon, label: 'Правила', url: '/rules' },
		{ id: 'stats', icon: StatsIcon, label: 'Статистика', url: '/stats' },
		{ id: 'achievements', icon: Trophy, label: 'Ачивки и скилны', url: '/achievements' },
		{ id: 'history', icon: History, label: 'История', url: '/history' },
		{ id: 'streams', icon: TV, label: 'Стримы', url: '/streams' },
		{ id: 'shit', icon: ShieldX, label: 'Подсеры' },
		{ id: 'wheels', icon: ShipWheel, label: 'Колеса', url: '/wheels' },
		{ id: 'calculator', icon: Calculator, label: 'Калькулятор', url: '/calc' },
		{ id: 'about', icon: DevelopersIcon, label: 'Создатели', url: '/about' }
	]


	const greetingText = $derived(app.myUser ? `Привет ${app.myUser.username}!` : "Привет!")

	function togglePhone() {
		isOpen = !isOpen
	}
</script>

<div class="fixed bottom-8 left-4 z-50">
	{#if isOpen}
		<div
			class="mb-2 h-[635px] w-[408px] pt-[100px]"
			style="background-image: url('{PHONE_BG}'); background-size: cover;"
			transition:fly={{ duration: 300, y: 20 }}
		>	
			<div class="w-full text-center text-2xl font-bold">{greetingText}</div>
			<div class="grid grid-cols-3 gap-[12px] pt-3 pb-[36px] px-[48px]">
				{#each apps as appItem (appItem.label)}
					{@const Icon = appItem.icon}
					{#if appItem.id === 'skins'}
						{#if app.myUser}
							<SkinEditorDialog>
								<button
									class="flex cursor-pointer flex-col items-center rounded-2xl transition-colors hover:bg-blue-500/20 p-0 w-fit"
								>
									<Icon class="mb-[2px] h-[80px] w-[80px] text-blue-400" />
									<span class="text-xs">{appItem.label}</span>
								</button>
							</SkinEditorDialog>
						{/if}
					{:else if appItem.id === 'shit'}
						{#if app.myUser}
							<ShitDialog>
								<button
									class="flex cursor-pointer flex-col items-center rounded-2xl transition-colors hover:bg-blue-500/20 w-fit"
								>
									<Icon class="mb-[2px] h-[80px] w-[80px] text-blue-400" />
									<span class="text-xs">{appItem.label}</span>
								</button>
							</ShitDialog>
						{/if}
					{:else}
						<button
							class="flex cursor-pointer flex-col items-center rounded-2xl transition-colors hover:bg-blue-500/20 w-fit"
							onclick={() => {
								if (appItem.url) {
									navStore.navigate(appItem.url)
								}
								isOpen = false
							}}
						>
							<Icon class="mb-[2px] h-[80px] w-[80px] text-blue-400" />
							<span class="text-xs">{appItem.label}</span>
						</button>
					{/if}
				{/each}
			</div>
			<div class="flex w-full justify-center">
				{#if app.myUser}
					{#if app.turnState === 'filling-form'}
							<MoveForm />
					{/if}
					<Button
						class="flex hidden cursor-pointer flex-col items-center rounded-2xl"
						onclick={() => {
							app.usersStore.logout()
							isOpen = false
						}}
					>
						<span class="text-xs">Выйти</span>
					</Button>
				{:else}
					<Button
						class="flex cursor-pointer flex-col items-center rounded-2xl"
						variant="default"
						onclick={() => {
							navStore.navigate('/login')
							isOpen = false
						}}
					>
						<span class="text uppercase">Логин</span>
					</Button>
				{/if}
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
