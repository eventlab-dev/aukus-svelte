<script lang="ts">
	import StatsCards from './StatsCards.svelte'

	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { statsStore, eventDataStore } = getAppManagerContext()
	const { stats } = statsStore
	const { achievementsWithScores } = eventDataStore

	const showStats = $derived.by(() => {
		const completed = $stats.reduce((acc, item) => acc + item.games_completed, 0)
		const dropped = $stats.reduce((acc, item) => acc + item.games_dropped, 0)
		const rerolls = $stats.reduce((acc, item) => acc + item.rerolls, 0)
		const sheikhs = $stats.reduce((acc, item) => acc + item.sheikh_moments, 0)
		const movies = $stats.reduce((acc, item) => acc + item.movies, 0)
		const unlockedAchievements = $stats.reduce(
			(acc, item) => acc + item.first_achievements + item.regular_achievements,
			0
		)
		const totalAchievements = $achievementsWithScores.length

		return [
			{ title: 'Игр пройдено за сезон', value: completed.toString() },
			{ title: 'Ходов совершено', value: '10/100' },
			{ title: 'Игр дропнуто', value: dropped.toString() },
			{ title: 'Рерольнуто игр', value: rerolls.toString() },
			{ title: 'Шейх-моментов', value: sheikhs.toString() },
			{ title: 'Фильмов просмотрено', value: movies.toString() },
			{ title: 'Средняя оценка игр', value: '0' },
			{ title: 'Достижений достигнуто', value: `${unlockedAchievements}/${totalAchievements}` },
			{ title: 'Подсеров кинуто', value: '0' },
			{ title: 'Защиты использовано', value: '0' }
		]
	})
</script>

<div class="max-w-[1100px]">
	<div class="mb-7 text-center text-6xl font-bold">Общая статистика</div>
	<div class="flex justify-center">
		<StatsCards stats={showStats} />
	</div>
</div>
