<script lang="ts">
	import type { PlayerData } from '$lib/types'
	import StatsCards from './StatsCards.svelte'

	type Props = {
		player: PlayerData
		position: number
	}

	let { player, position }: Props = $props()

	const playerStats = $derived.by(() => {
		return [{ title: 'Всего', value: '100' }]
	})
</script>

<div class="mt-[100px] flex flex-col">
	<div class="mb-[20px] w-full text-center">
		<div
			class="text-xl font-bold text-[var(--player-color)] italic"
			style={`--player-color: ${player.color}`}
		>
			{position}-ое место
		</div>
		<div class="text-6xl font-bold">
			{player.first_name}
			{player.username}
		</div>
	</div>
	<div class="flex w-full justify-center">
		<div class="flex max-w-[1100px] justify-center">
			<StatsCards stats={playerStats} />
		</div>
	</div>
</div>
