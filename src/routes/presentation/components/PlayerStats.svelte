<script lang="ts">
	import type { PlayerData } from '$lib/types'
	import GameCard from './GameCard.svelte'
	import { formatDuration } from '$lib/utils'
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import GamepadIcon from '$lib/components/icons/new/GamepadIcon.svelte'
	import StatsCards from './StatsCards.svelte'
	import { fly } from 'svelte/transition'
	import WinIcon from '$lib/components/icons/new/WinIcon.svelte'
	import PlayerModel from '$lib/components/map/PlayerModel.svelte'
	import SkinPreview from '$lib/components/skinEditor/SkinPreview.svelte'
	import type { UnlockedAchievementItem } from '$lib/heyapi/aukus/types.gen'

	type Props = {
		player: PlayerData
		position: number
	}

	let { player, position }: Props = $props()

	const { statsStore, eventDataStore } = getAppManagerContext()
	const { statsBySlug } = statsStore
	const { achievementsWithScores, achievementsById, skinsById, achievementsRarity } = eventDataStore

	const playerStats = $derived.by(() => {
		const stats = $statsBySlug[player.slug]
		if (stats) {
			const totalAchievements = $achievementsWithScores.length
			const playerAchievements = stats.first_achievements + stats.regular_achievements

			return [
				{ title: 'Игр пройдено', value: stats.games_completed.toString() },
				{ title: 'Ходов сделано', value: stats.total_moves.toString() },
				{ title: 'Игр дропнуто', value: stats.games_dropped.toString() },
				{ title: 'Шейх-моментов', value: stats.sheikh_moments.toString() },
				{ title: 'Часов наиграно', value: formatDuration(stats.games_time).toString() },
				{ title: 'Фильмов просмотрено', value: stats.movies.toString() },
				{ title: 'Средняя оценка игр', value: stats.average_rating.toFixed(2) },
				{
					title: `Очки за ачивки: ${playerAchievements}/${totalAchievements}`,
					value: (playerAchievements * 3).toString()
				},
				{ title: 'Подсеров кинуто', value: stats.shits_thrown.toString() },
				{ title: 'Защиты использовано', value: stats.shields_used.toString() }
			]
		}
		return []
	})

	const { bestGame, worstGame } = $derived.by(() => {
		const stats = $statsBySlug[player.slug]
		return { bestGame: stats?.best_game, worstGame: stats?.worst_game }
	})

	const achievementsPercent = $derived.by(() => {
		const stats = $statsBySlug[player.slug]
		if (stats) {
			const totalAchievements = $achievementsWithScores.length
			const playerAchievements = stats.first_achievements + stats.regular_achievements
			// round
			return (playerAchievements / totalAchievements) * 100
		}
		return 0
	})

	const rareAchievement = $derived.by(() => {
		const rare = player.unlocked_achievements.reduce(
			(acc: UnlockedAchievementItem | null, next: UnlockedAchievementItem) => {
				const nextRarity = $achievementsRarity.get(next.id)
				if (!acc) {
					if (nextRarity) {
						return next
					}
					return acc
				}
				const accRarity = $achievementsRarity.get(acc.id)

				if (nextRarity && accRarity) {
					if (nextRarity === accRarity) {
						return acc.unlocked_at > next.unlocked_at ? acc : next
					}
					return nextRarity < accRarity ? next : acc
				}
				return acc
			},
			null
		)
		if (rare) {
			return $achievementsById.get(rare.id)
		}
		return null
	})

	const gamesDelay = 1000
</script>

<div class="mt-[100px] mb-[200px] flex flex-col">
	{#key player.slug}
		<div class="mb-[20px] w-full text-center">
			<div
				class="font-roboto-wide-semibold-italic mb-[20px] text-xl text-[var(--player-color)] italic"
				style={`--player-color: ${player.color}`}
			>
				{position}-ое место
			</div>
			<div in:fly|global={{ duration: 500, delay: 0, y: 100 }}>
				<div class="flex w-full justify-center">
					<PlayerAvatar src={player.avatar_link ?? ''} name={player.username} size="lg" />
				</div>
				<div class="font-roboto-wide-black-alt text-6xl">
					{player.first_name} «{player.username}»
				</div>
			</div>
		</div>
		<div class="flex w-full justify-center">
			<div class="flex max-w-[1100px] justify-center">
				<StatsCards stats={playerStats} />
			</div>
		</div>
		<div
			class="font-roboto-wide-black-alt mt-[120px] mb-[20px] flex w-full items-center justify-center gap-[10px] text-3xl text-[var(--player-color)]"
			style={`--player-color: ${player.color}`}
		>
			<WinIcon class="size-8" />
			Достижения
		</div>
		<div class="flex w-full justify-center gap-3">
			<div class="w-fit rounded-xl bg-card p-3">
				<div class="text-[#9F9F9F]">Достижений получено</div>
				<div class="mt-5 text-7xl font-bold">{achievementsPercent.toFixed(0)}%</div>
			</div>
			{#if rareAchievement}
				{@const skin = $skinsById.get(rareAchievement.reward_skin_id)}
				{#if skin}
					<div class="w-[440px] rounded-xl bg-card p-3">
						<div class="text-[#9F9F9F]">Самое редкое достижение</div>
						<div class="align-center mt-5 flex gap-3 text-2xl font-bold">
							<div class="h-[100px]"><SkinPreview {skin} /></div>
							{rareAchievement.description}
						</div>
					</div>
				{/if}
			{/if}
			<div class="flex w-[144px] justify-center rounded-xl bg-card">
				<PlayerModel {player} variant="big" />
			</div>
		</div>
		<div
			class="font-roboto-wide-black-alt mt-[120px] mb-[20px] flex w-full items-center justify-center gap-[10px] text-3xl text-[var(--player-color)]"
			style={`--player-color: ${player.color}`}
			in:fly|global={{ y: 5000, duration: 1000, delay: gamesDelay }}
		>
			<GamepadIcon class="size-8" />
			Игры
		</div>
		<div class="flex w-full justify-center gap-3">
			{#if bestGame}
				<div in:fly|global={{ x: -5000, duration: 1000, delay: gamesDelay }}>
					<GameCard game={bestGame} title="Лучшая игра на ивенте" />
				</div>
			{/if}
			{#if worstGame}
				<div in:fly|global={{ x: 5000, duration: 1000, delay: gamesDelay }}>
					<GameCard game={worstGame} title="Худшая игра на ивенте" />
				</div>
			{/if}
		</div>
	{/key}
</div>
