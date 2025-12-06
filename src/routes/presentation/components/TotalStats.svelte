<script lang="ts">
	import StatsCards from './StatsCards.svelte'
	import GameCard from './GameCard.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { statsStore, eventDataStore } = getAppManagerContext()
	const { stats } = statsStore
	const { achievementsWithScores, achievements } = eventDataStore

	const showStats = $derived.by(() => {
		const completed = $stats.reduce((acc, item) => acc + item.games_completed, 0)
		const dropped = $stats.reduce((acc, item) => acc + item.games_dropped, 0)
		const rerolls = $stats.reduce((acc, item) => acc + item.rerolls, 0)
		const sheikhs = $stats.reduce((acc, item) => acc + item.sheikh_moments, 0)
		const movies = $stats.reduce((acc, item) => acc + item.movies, 0)

		const achievementsIds = $achievementsWithScores.map((a) => a.id)

		const unlockedAchievements = $achievements.filter(
			(a) => a.visibility !== 'hidden' && achievementsIds.includes(a.id)
		).length
		const totalAchievements = $achievementsWithScores.length

		const totalMoves = $stats.reduce((acc, item) => acc + item.total_moves, 0)
		const avgRating = $stats.reduce((acc, item) => acc + item.average_rating, 0)
		const shitsThrown = $stats.reduce((acc, item) => acc + item.shits_thrown, 0)
		const shieldsUsed = $stats.reduce((acc, item) => acc + item.shields_used, 0)

		return [
			{ title: 'Игр пройдено за сезон', value: completed.toString() },
			{ title: 'Ходов совершено', value: totalMoves.toString() },
			{ title: 'Игр дропнуто', value: dropped.toString() },
			{ title: 'Рерольнуто игр', value: rerolls.toString() },
			{ title: 'Шейх-моментов', value: sheikhs.toString() },
			{ title: 'Фильмов просмотрено', value: movies.toString() },
			{ title: 'Средняя оценка игр', value: avgRating.toFixed(2) },
			{ title: 'Достижений достигнуто', value: `${unlockedAchievements}/${totalAchievements}` },
			{ title: 'Подсеров кинуто', value: shitsThrown.toString() },
			{ title: 'Защиты использовано', value: shieldsUsed.toString() }
		]
	})

	const bestGame = $derived.by(() => {
		return $stats.reduce((acc, item) => {
			const game = item.best_game
			if (!acc) {
				return game
			}
			if (game.item_rating > acc.item_rating) {
				return game
			}
			if (game.item_duration > acc.item_duration) {
				return game
			}
			return acc
		}, null)
	})

	const worstGame = $derived.by(() => {
		return $stats.reduce((acc, item) => {
			const game = item.worst_game
			if (!acc) {
				return game
			}
			if (game.item_rating < acc.item_rating) {
				return game
			}
			if (game.item_duration > acc.item_duration) {
				return game
			}
			return acc
		}, null)
	})
</script>

<div class="max-w-[1100px]">
	<div class="font-roboto-wide-semibold-italic mb-3 text-center text-xl text-primary">
		Общая статистика
	</div>
	<div class="font-roboto-wide-black-alt mb-7 text-center text-6xl">АУКУС 4</div>
	<div class="flex justify-center">
		<StatsCards stats={showStats} />
	</div>
	{#if bestGame}
		<div class="mt-3 flex justify-center gap-3">
			<GameCard game={bestGame} title="Лучшая игра за сезон" />
			<GameCard game={worstGame} title="Худшая игра за сезон" />
		</div>
	{/if}
</div>
