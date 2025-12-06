<script lang="ts">
	import type { PlayerData } from '$lib/types'
	import ImageLoader from '$lib/components/ImageLoader.svelte'
	import { formatDuration, renderToHTML } from '$lib/utils'
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import GamepadIcon from '$lib/components/icons/new/GamepadIcon.svelte'
	import StatsCards from './StatsCards.svelte'
	import { fly, slide } from 'svelte/transition'

	type Props = {
		player: PlayerData
		position: number
	}

	let { player, position }: Props = $props()

	const { statsStore, eventDataStore } = getAppManagerContext()
	const { statsBySlug } = statsStore
	const { achievementsWithScores } = eventDataStore

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
</script>

{#snippet gameCard(game: PlayerMove, title: str)}
	<div class="flex w-[440px] flex-col gap-3 rounded-xl bg-card p-3">
		<div class="flex justify-between text-[#9F9F9F]">
			<div>{title}</div>
			<div>{formatDuration(game.item_duration)}</div>
		</div>
		<div class="flex gap-2">
			<div>
				<ImageLoader
					src={game.cover_image_url || ''}
					alt={game.item_title || ''}
					class="h-auto w-[80px]"
				/>
			</div>
			<div class="text-2xl font-bold">{game.item_title} — {game.item_rating}/10</div>
		</div>
		<div>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html renderToHTML(game.item_review)}
		</div>
	</div>
{/snippet}

<div class="mt-[100px] flex flex-col">
	{#key player.slug}
		<div class="mb-[20px] w-full text-center">
			<div
				class="font-roboto-wide-semibold-italic mb-[20px] text-xl text-[var(--player-color)] italic"
				style={`--player-color: ${player.color}`}
			>
				{position}-ое место
			</div>
			<div in:slide|global={{ y: 20, duration: 2000, delay: 0 }}>
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
			<GamepadIcon class="size-8" />
			Игры
		</div>
		<div class="flex w-full justify-center gap-3">
			{#if bestGame}{@render gameCard(bestGame, 'Лучшая игра на ивенте')}{/if}
			{#if worstGame}{@render gameCard(worstGame, 'Худшая игра на ивенте')}{/if}
		</div>
	{/key}
</div>
