<script lang="ts">
	import { fade } from 'svelte/transition'
	import StatTable from './components/StatTable.svelte'
	import type { TableHeaderType } from '$lib/types'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { PlayerStatsItem } from '$lib/heyapi/aukus/types.gen'

	type StatItem = PlayerStatsItem & {
		username: string
		avatarLink: string
		currentGame: string
		position: number
	}

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
				currentGame: player.current_game ?? '<Нет игры>',
				position: idx + 1
			}
		})
	})

	// const leaderboardData = generateLeaderboardData(12)
	// const moveStatData = generateMoveStatData(12)

	const leaderboardHeaders: LeaderboardHeadersType = [
		{ key: 'position', name: '№', width: 20 },
		{ key: 'avatarLink', name: '', width: 27 },
		{ key: 'username', name: 'Стример', width: 137 },
		{ key: 'map_position', name: 'Позиция', width: 114 },
		// { key: 'score', name: 'Очки', width: 86 },
		{ key: 'games_completed', name: 'Пройдено', width: 120 },
		{ key: 'games_dropped', name: 'Дропы', width: 94 },
		{ key: 'rerolls', name: 'Реролы', width: 102 },
		{ key: 'movies', name: 'Фильмы', width: 104 },
		{ key: 'sheikh_moments', name: 'Шейхи', width: 104 },
		{ key: 'currentGame', name: 'Выпало на ауке', width: 242 }
	]

	const moveStatHeaders: MoveStatHeadersType = [
		{ key: 'avatarLink', name: '', width: 27 },
		{ key: 'username', name: 'Стример', width: 137 },
		{ key: 'total_moves', name: 'Ходов', width: 90 },
		{ key: 'ladders', name: 'Лестниц', width: 104 },
		{ key: 'snakes', name: 'Змеек', width: 88 },
		{ key: 'average_move', name: 'Средний ход', width: 140 },
		{ key: 'average_dice_roll', name: 'Средний ролл', width: 150 },
		{ key: 'ladders_moves_sum', name: 'Клеток буста', width: 146 },
		{ key: 'snakes_moves_sum', name: 'Клеток падений', width: 180 }
	]
</script>

{#if statsWithPlayerInfo}
	<div in:fade>
		<div class="mt-[100px] flex flex-col items-center space-y-[50px]">
			<div class="text-[40px] leading-12 font-bold">Таблица лидеров</div>
			<StatTable data={statsWithPlayerInfo} headers={leaderboardHeaders} />
		</div>
		<div class="mt-[150px] flex flex-col items-center space-y-[50px]">
			<div class="text-[40px] leading-12 font-bold">Статистика ходов</div>
			<StatTable data={statsWithPlayerInfo} headers={moveStatHeaders} />
		</div>
	</div>
{/if}
