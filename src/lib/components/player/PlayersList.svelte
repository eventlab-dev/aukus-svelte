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

	$effect(() => {
		const interval = setInterval(() => {
			currentTime = currentMskTime()
		}, 60 * 1000)

		return () => clearInterval(interval)
	})
</script>

{#key app.playersInOrder.length}
	<div class="flex flex-col gap-[6px]">
		{#each app.playersInOrder as player (player.slug)}
			<PlayerCard {player} />
		{/each}
	</div>
{/key}
