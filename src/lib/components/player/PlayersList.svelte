<script lang="ts">
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import PlayerCard from './PlayerCard.svelte'

	const app = getAppManager()

	function currentMskTime() {
		const date = new Date()
		return date.toLocaleTimeString('ru-RU', {
			hour: '2-digit',
			hour12: false,
			minute: '2-digit',
			timeZone: 'Europe/Moscow'
		})
	}

	let currentTime = $state(currentMskTime())

	// Индекс наведённой карточки для dock-магнификации соседей
	let hoveredIndex = $state<number | null>(null)

	function magnifyFor(i: number): number {
		if (hoveredIndex === null) return 0
		return i === hoveredIndex ? 2 : 0
	}

	$effect(() => {
		const interval = setInterval(() => {
			currentTime = currentMskTime()
		}, 60 * 1000)

		return () => clearInterval(interval)
	})
</script>

{#key app.playersInOrder.length}
	<div class="flex flex-col gap-[6px]">
		{#each app.playersInOrder as player, i (player.slug)}
			<PlayerCard
				{player}
				magnify={magnifyFor(i)}
				onHoverChange={(hovered) => {
					hoveredIndex = hovered ? i : hoveredIndex === i ? null : hoveredIndex
				}}
			/>
		{/each}
	</div>
{/key}
