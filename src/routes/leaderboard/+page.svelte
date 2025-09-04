<script lang="ts">
	import { fade } from 'svelte/transition';
	import StatTable from './components/StatTable.svelte';
	import type { TableHeaderType } from '$lib/types';
	import { randomInt } from '$lib/utils';

	type LeaderboardHeadersType = TableHeaderType<(typeof leaderboardData)[number]>[];
	type MoveStatHeadersType = TableHeaderType<(typeof moveStatData)[number]>[];

	const leaderboardData = generateLeaderboardData(12);
	const moveStatData = generateMoveStatData(12);

	const leaderboardHeaders: LeaderboardHeadersType = [
		{ key: 'id', name: '№', width: 42 },
		{ key: 'avatarLink', name: '', width: 27 },
		{ key: 'name', name: 'Имя', width: 137 },
		{ key: 'position', name: 'Позиция', width: 114 },
		{ key: 'score', name: 'Очки', width: 86 },
		{ key: 'completed', name: 'Пройдено', width: 120 },
		{ key: 'dropped', name: 'Дропы', width: 94 },
		{ key: 'rerroled', name: 'Реролы', width: 102 },
		{ key: 'movies', name: 'Фильмы', width: 104 },
		{ key: 'sheikhs', name: 'Шейхи', width: 104 },
		{ key: 'currentMove', name: 'Выпало на ауке', width: 242 }
	];

	const moveStatHeaders: MoveStatHeadersType = [
		{ key: 'avatarLink', name: '', width: 27 },
		{ key: 'name', name: 'Имя', width: 137 },
		{ key: 'moves', name: 'Ходов', width: 90 },
		{ key: 'stairs', name: 'Лестниц', width: 104 },
		{ key: 'snakes', name: 'Змеек', width: 88 },
		{ key: 'averageMove', name: 'Средний ход', width: 140 },
		{ key: 'averageRoll', name: 'Средний ролл', width: 150 },
		{ key: 'boostCells', name: 'Клеток буста', width: 146 },
		{ key: 'fallCells', name: 'Клеток падений', width: 180 }
	];

	function generateLeaderboardData(amount: number) {
		return Array.from({ length: amount }, (_, idx) => ({
			id: idx + 1,
			name: Array.from({ length: 5 }, () =>
				String.fromCharCode(97 + Math.floor(Math.random() * 26))
			).join(''),
			avatarLink:
				'https://static-cdn.jtvnw.net/jtv_user_pictures/ce8be9fe-c33d-412e-aea6-98497a74390b-profile_image-50x50.png',
			position: randomInt(1, 100),
			score: randomInt(100, 1000),
			completed: randomInt(1, 10),
			dropped: randomInt(0, 5),
			rerroled: randomInt(0, 3),
			movies: randomInt(1, 10),
			sheikhs: randomInt(0, 3),
			currentMove: `Game ${randomInt(1, 100)}`
		}));
	}

	function generateMoveStatData(amount: number) {
		return Array.from({ length: amount }, (_, idx) => ({
			name: Array.from({ length: 5 }, () =>
				String.fromCharCode(97 + Math.floor(Math.random() * 26))
			).join(''),
			avatarLink:
				'https://static-cdn.jtvnw.net/jtv_user_pictures/ce8be9fe-c33d-412e-aea6-98497a74390b-profile_image-50x50.png',
			moves: randomInt(1, 10),
			stairs: randomInt(1, 10),
			snakes: randomInt(0, 5),
			averageMove: randomInt(1, 10),
			averageRoll: randomInt(1, 10),
			boostCells: randomInt(1, 10),
			fallCells: randomInt(0, 3)
		}));
	}
</script>

<div in:fade>
	<div class="mt-[100px] flex flex-col items-center space-y-[50px]">
		<div class="text-[40px] leading-12 font-bold">Таблица лидеров</div>
		<StatTable data={leaderboardData} headers={leaderboardHeaders} />
	</div>
	<div class="mt-[150px] flex flex-col items-center space-y-[50px]">
		<div class="text-[40px] leading-12 font-bold">Статистика ходов</div>
		<StatTable data={moveStatData} headers={moveStatHeaders} />
	</div>
</div>
