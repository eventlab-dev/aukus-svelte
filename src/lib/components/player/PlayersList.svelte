<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import PlayerCard from './PlayerCard.svelte'

	const { playersInOrder } = getAppManagerContext()

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

{#key $playersInOrder.length}
	<div class="flex flex-col gap-[6px]">
		{#each $playersInOrder as player (player.slug)}
			<PlayerCard {player} />
		{/each}
	</div>
{/key}
