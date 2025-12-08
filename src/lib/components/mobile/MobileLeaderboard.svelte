<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { StatItem, TableHeaderType } from '$lib/types'
	import StatTable from '../../../routes/leaderboard/components/StatTable.svelte'

	type Props = {
		navigateToPlayer: (slug: string) => void
	}

	let { navigateToPlayer }: Props = $props()

	type LeaderboardHeadersType = TableHeaderType<StatItem>[]
	type MoveStatHeadersType = TableHeaderType<StatItem>[]

	const { statsStore, playersInOrder } = getAppManagerContext()
	const { statsBySlug } = statsStore

	const statsWithPlayerInfo = $derived.by(() => {
		return $playersInOrder.map((player, idx) => {
			const playerStat = $statsBySlug[player.slug]
			return {
				...player,
				...playerStat,
				username: player.username,
				avatarLink: player.avatar_link ?? '',
				currentGame: player.current_game ?? 'Выбирает игру...',
				currentGameDuration: player.current_game_duration ?? null,
				position: idx + 1,
				games_time: playerStat.games_time * 1000
			}
		})
	})

	type Tab = 'leaderboard' | 'moves'
	let activeTab = $state<Tab>('leaderboard')

	const leaderboardHeaders: LeaderboardHeadersType = [
		{ key: 'position', name: '№', width: 40 },
		{ key: 'avatarLink', name: '', width: 40 },
		{ key: 'username', name: 'Стример', width: 120 },
		{ key: 'map_position', name: 'Поз.', width: 60 },
		{ key: 'total_score', name: 'Очки', width: 70 },
		{ key: 'games_completed', name: 'Прой.', width: 70 },
		{ key: 'games_dropped', name: 'Дроп', width: 70 },
		{ key: 'rerolls', name: 'Рерол', width: 70 },
		{ key: 'movies', name: 'Фильм', width: 70 },
		{ key: 'sheikh_moments', name: 'Шейх', width: 70 },
		{ key: 'games_time', name: 'Наиграно', width: 110 }
	]

	const moveStatHeaders: MoveStatHeadersType = [
		{ key: 'avatarLink', name: '', width: 40 },
		{ key: 'username', name: 'Стример', width: 120 },
		{ key: 'total_moves', name: 'Ходов', width: 70 },
		{ key: 'ladders', name: 'Лест.', width: 70 },
		{ key: 'snakes', name: 'Змеек', width: 70 },
		{ key: 'average_move', name: 'Ср.ход', width: 80 },
		{ key: 'average_dice_roll', name: 'Ср.ролл', width: 80 },
		{ key: 'ladders_moves_sum', name: 'Буст', width: 70 },
		{ key: 'snakes_moves_sum', name: 'Падений', width: 80 }
	]
</script>

<div class="flex flex-col gap-4">
	<div class="flex gap-2">
		<button
			class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors {activeTab ===
			'leaderboard'
				? 'bg-primary text-primary-foreground'
				: 'bg-secondary text-secondary-foreground'}"
			onclick={() => (activeTab = 'leaderboard')}
		>
			Лидеры
		</button>
		<button
			class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors {activeTab ===
			'moves'
				? 'bg-primary text-primary-foreground'
				: 'bg-secondary text-secondary-foreground'}"
			onclick={() => (activeTab = 'moves')}
		>
			Ходы
		</button>
	</div>

	<div class="overflow-x-auto">
		{#key activeTab}
			{#if activeTab === 'leaderboard'}
				<StatTable data={statsWithPlayerInfo} headers={leaderboardHeaders} {navigateToPlayer} />
			{:else}
				<StatTable data={statsWithPlayerInfo} headers={moveStatHeaders} {navigateToPlayer} />
			{/if}
		{/key}
	</div>
</div>
