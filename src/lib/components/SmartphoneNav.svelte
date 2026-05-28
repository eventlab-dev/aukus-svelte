<script lang="ts">
	import MapIcon from './icons/new/MapIcon.svelte'
	import StatsIcon from './icons/new/StatsIcon.svelte'
	import RulesIcon from './icons/new/RulesIcon.svelte'
	import DevelopersIcon from './icons/new/DevelopersIcon.svelte'
	import { fly } from 'svelte/transition'

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
			class="mb-3 rounded-[2.5rem] border-4 border-gray-800 bg-gray-900 p-4 shadow-2xl"
			transition:fly={{ duration: 300, y: 20 }}
		>
			<div class="mb-4 flex items-center justify-between">
				<div class="h-2 w-20 rounded-full bg-gray-700"></div>
				<div class="h-2 w-2 rounded-full bg-gray-700"></div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				{#each apps as app (app.url)}
					{@const Icon = app.icon}
					<a
						href={app.url}
						class="flex flex-col items-center rounded-2xl bg-gray-800 p-4 transition-colors hover:bg-gray-700"
						onclick={() => (isOpen = false)}
					>
						<Icon class="mb-2 h-8 w-8 text-blue-400" />
						<span class="text-xs text-gray-300">{app.label}</span>
					</a>
				{/each}
			</div>
			<div class="mt-4 flex justify-center">
				<div class="h-1 w-24 rounded-full bg-gray-700"></div>
			</div>
		</div>
	{/if}

	<button
		onclick={togglePhone}
		aria-label="Toggle navigation menu"
		class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 hover:scale-105"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'}
		>
			<path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
			<line x1="12" y1="2" x2="12" y2="12"></line>
		</svg>
	</button>
</div>
