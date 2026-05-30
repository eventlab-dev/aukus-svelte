<script lang="ts">
	import MapIcon from './icons/new/MapIcon.svelte'
	import StatsIcon from './icons/new/StatsIcon.svelte'
	import RulesIcon from './icons/new/RulesIcon.svelte'
	import DevelopersIcon from './icons/new/DevelopersIcon.svelte'
	import { fly } from 'svelte/transition'
	import Smartphone from '@lucide/svelte/icons/smartphone'

	let isOpen = $state(false)

	const apps = [
		{ icon: MapIcon, label: 'Карта', url: '/' },
		{ icon: StatsIcon, label: 'Таблица', url: '/leaderboard' },
		{ icon: RulesIcon, label: 'Правила', url: '/rules' },
		{ icon: DevelopersIcon, label: 'Создатели', url: '/developers' }
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
				{#each apps as app (app.url)}
					{@const Icon = app.icon}
					<a
						href={app.url}
						class="flex flex-col items-center rounded-2xl transition-colors "
						onclick={() => (isOpen = false)}
					>
						<Icon class="mb-[2px] h-[80px] w-[80px] text-blue-400" />
						<span class="text-xs text-card-blue-foreground">{app.label}</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<button
		onclick={togglePhone}
		aria-label="Toggle navigation menu"
		class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105"
	>
		<Smartphone />
	</button>
</div>
