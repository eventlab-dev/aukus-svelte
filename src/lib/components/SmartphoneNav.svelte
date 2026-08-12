<script lang="ts">
	import { fly } from 'svelte/transition'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { Button } from './ui/button'
	import type { AppUrl } from '$lib/stores/NavStore.svelte'
	import MoveForm from './moveForm/MoveForm.svelte'
	import {
		MENU_ABOUT_ICON,
		MENU_ACHIEVEMENTS_ICON,
		MENU_CALC_ICON,
		MENU_HISTORY_ICON,
		MENU_PHONE_ICON,
		MENU_RULES_ICON,
		MENU_SHIT_ICON,
		MENU_STATS_ICON,
		MENU_STREAMS_ICON,
		MENU_WHEELS_ICON,
		PHONE_BG
	} from '$lib/constants'

	let isOpen = $state(false)

	const app = getAppManager()
	const { navStore, timeStore } = app

	type AppItem = {
		id: string
		icon: string
		label: string
		url?: AppUrl
	}

	const apps: AppItem[] = [
		{ id: 'rules', icon: MENU_RULES_ICON, label: 'Правила', url: '/rules' },
		{ id: 'stats', icon: MENU_STATS_ICON, label: 'Статистика', url: '/stats' },
		{
			id: 'achievements',
			icon: MENU_ACHIEVEMENTS_ICON,
			label: 'Ачивки и скины',
			url: '/achievements'
		},
		{ id: 'history', icon: MENU_HISTORY_ICON, label: 'История', url: '/history' },
		{ id: 'streams', icon: MENU_STREAMS_ICON, label: 'Стримы', url: '/streams' },
		{ id: 'shit', icon: MENU_SHIT_ICON, label: 'Подсеры' },
		{ id: 'wheels', icon: MENU_WHEELS_ICON, label: 'Колеса', url: '/wheels' },
		{ id: 'calculator', icon: MENU_CALC_ICON, label: 'Калькулятор', url: '/calc' },
		{ id: 'about', icon: MENU_ABOUT_ICON, label: 'Создатели', url: '/about' }
	]

	const greetingText = $derived(app.myUser ? `Привет ${app.myUser.username}!` : 'Привет!')

	const time = $derived(timeStore.formatNow({ hour12: false, hour: '2-digit', minute: '2-digit' }))

	function togglePhone() {
		isOpen = !isOpen
	}

	let popup: HTMLDivElement | null = $state(null)

	function handleOutsidePointerDown(event: PointerEvent) {
		if (popup && !popup.contains(event.target as Node)) {
			isOpen = false
		}
	}

	$effect(() => {
		if (!isOpen) return

		document.addEventListener('pointerdown', handleOutsidePointerDown)

		return () => {
			document.removeEventListener('pointerdown', handleOutsidePointerDown)
		}
	})
</script>

<div class="fixed bottom-8 left-4 z-50">
	{#if isOpen}
		<div
			bind:this={popup}
			class="relative mb-2 h-[560px] w-[360px] pt-[66px]"
			style="background-image: url('{PHONE_BG}'); background-size: cover;"
			transition:fly={{ duration: 300, y: 20 }}
		>
			<div class="absolute top-[27px] right-[48px] font-extrabold">{time} МСК</div>
			<div class="w-full text-center text-2xl font-bold">{greetingText}</div>
			<div class="grid grid-cols-3 gap-[12px] px-[48px] pt-3 font-extrabold">
				{#each apps as appItem (appItem.label)}
					<button
						class="flex w-fit cursor-pointer flex-col items-center rounded-2xl transition-colors hover:bg-blue-500/20"
						onclick={() => {
							if (appItem.url) {
								navStore.pageParams = {}
								navStore.navigate(appItem.url)
							}
							isOpen = false
						}}
					>
						<img src={appItem.icon} class="mb-[2px] h-[80px] w-[80px]" alt={appItem.label} />
						<span class="text-sm uppercase wrap-anywhere">{appItem.label}</span>
					</button>
				{/each}
			</div>
			<div class="flex w-full justify-center mt-3">
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
		class="flex h-auto w-[78px] items-center justify-center rounded-full bg-transparent text-white shadow-lg transition-all hover:scale-120 hover:bg-transparent"
	>
		<img src={MENU_PHONE_ICON} alt="phone" />
	</Button>
</div>
