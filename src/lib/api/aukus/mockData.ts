import type { PlayerMoveItem } from '$lib/heyapi/aukus/types.gen'
import type { PlayerData } from '$lib/types'
import { randomInt } from '../../utils'

const playerLasqa: PlayerData = {
	username: 'Lasqa',
	slug: 'lasqa',
	twitch_stream_link: '',
	vk_stream_link: '',
	total_score: 800,
	avatar_link: '',
	donation_link: 'https://www.donationalerts.com/r/lasqa',
	kick_stream_link: 'https://live.kickplay.ru/lasqa',
	map_position: 0,
	is_online: 1,
	first_name: 'Богдан',
	telegram_link: 'https://t.me/lasqa',
	current_game: "Baldur's Gate 3",
	current_game_duration: 37334,
	current_game_updated_at: 1759051743,
	current_game_cover: 'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
	color: '#FF4500',
	is_active: 1,
	role: 'streamer',
	equipped_skins: [],
	main_platform: 'twitch',
	online_count: 100,
	unlocked_achievements: [],
	available_skins: [],
	last_move: null
}

const playerSegall: PlayerData = {
	username: 'Segall',
	slug: 'segall',
	total_score: 700,
	avatar_link: '',
	twitch_stream_link: 'https://www.twitch.tv/segall',
	vk_stream_link: 'https://live.vkplay.ru/segall',
	donation_link: 'https://www.donationalerts.com/r/segall',
	kick_stream_link: '',
	current_game: '',
	map_position: 8,
	is_online: 0,
	first_name: 'Александр',
	telegram_link: 'https://t.me/segall',
	current_game_updated_at: 1759051743,
	current_game_cover: 'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
	current_game_duration: 2000,
	color: '#FF4500',
	is_active: 1,
	role: 'streamer',
	equipped_skins: [],
	main_platform: 'twitch',
	online_count: 100,
	unlocked_achievements: [],
	available_skins: [],
	last_move: null
}

const playerRoadhouse: PlayerData = {
	username: 'Roadhouse',
	slug: 'roadhouse',
	total_score: 600,
	avatar_link: '',
	twitch_stream_link: 'https://www.twitch.tv/roadhouse',
	vk_stream_link: 'https://live.vkplay.ru/roadhouse',
	donation_link: 'https://www.donationalerts.com/r/roadhouse',
	kick_stream_link: '',

	map_position: 6,
	current_game: 'Call of Duty: Black Ops Cold War',
	is_online: 1,
	online_count: 1146,
	first_name: 'Андрей',
	telegram_link: 'https://t.me/roadhouse',
	current_game_updated_at: 1759050743,
	current_game_cover: 'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
	current_game_duration: 2000,
	color: '#FF4500',
	is_active: 1,
	role: 'streamer',
	equipped_skins: [],
	main_platform: 'twitch',
	unlocked_achievements: [],
	available_skins: [],
	last_move: null
}

const playerPraden: PlayerData = {
	username: 'Praden',
	slug: 'praden',
	total_score: 500,
	avatar_link: '',
	twitch_stream_link: 'https://www.twitch.tv/roadhouse',
	vk_stream_link: 'https://live.vkplay.ru/roadhouse',
	donation_link: 'https://www.donationalerts.com/r/roadhouse',
	kick_stream_link: '',
	map_position: 6,
	current_game: 'Готика',
	is_online: 1,
	online_count: 864,
	first_name: 'Денис',
	telegram_link: 'https://t.me/roadhouse',
	current_game_updated_at: 1759041743,
	current_game_cover: 'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
	current_game_duration: 18034,
	color: '#FF4500',
	is_active: 1,
	role: 'streamer',
	equipped_skins: [],
	main_platform: 'twitch',
	unlocked_achievements: [],
	available_skins: [],
	last_move: null
}

export const playersMock = [playerLasqa, playerSegall, playerRoadhouse, playerPraden].toSorted(
	(a, b) => {
		if (a.username > b.username) {
			return 1
		} else {
			return -1
		}
	}
)

export const playerMovesData: PlayerMoveItem[] = [
	{
		id: 1,
		player_slug: 'player_1',
		created_at: 1759051743,
		item_title: 'NieR: Automata (2017)',
		type: 'completed',
		dice_roll_id: 1,
		dice_roll_sum: 8,
		dice_roll: [3, 5],
		cell_to: 3,
		cell_from: 0,
		item_review:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Игра отличная для своего жанра (АНИМЕ-ПЛАТФОРМЕР-ГОЛОВОЛОМКА НАХУЙ), 10 НЯ из 10, да...."},{"type":"image","attrs":{"src":"https://cdn.7tv.app/emote/01K1KQ1X1M8K7XME2MZVDRMKRS/1x.avif","alt":null,"title":null,"width":null,"height":null}}]}]}',
		item_rating: 5,
		ladder_from: null,
		ladder_to: null,
		snake_from: null,
		snake_to: null,
		item_length: '15-30',
		item_duration: 11285,
		cover_image_url: 'https://howlongtobeat.com/games/38029_Nier_Automata.jpg?width=250',
		vod_links:
			'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
		game_id: 1,
		difficulty_level: 0,
		updated_at: 1759051743
	},

	{
		player_slug: 'player_1',
		created_at: 1759051743,
		id: 2,
		item_title: 'NieR: Automata (2017)',
		type: 'drop',
		dice_roll_id: 2,
		dice_roll_sum: 7,
		dice_roll: [3, 4],
		cell_to: 3,
		cell_from: 0,
		item_review:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Игра отличная для своего жанра (АНИМЕ-ПЛАТФОРМЕР-ГОЛОВОЛОМКА НАХУЙ), 10 НЯ из 10, да...."}]}]}',
		item_rating: 5,
		ladder_from: null,
		ladder_to: null,
		snake_from: null,
		snake_to: null,
		item_length: '15-30',
		item_duration: 11285,
		cover_image_url: 'https://howlongtobeat.com/games/38029_Nier_Automata.jpg?width=250',
		vod_links:
			'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
		game_id: 1,
		difficulty_level: 1,
		updated_at: 1759051743
	},
	{
		player_slug: 'player_1',
		created_at: 1759051743,
		id: 3,
		item_title: 'NieR: Automata (2017)',
		type: 'reroll',
		dice_roll_id: 3,
		dice_roll_sum: 4,
		dice_roll: [2, 2],
		cell_to: 3,
		cell_from: 0,
		item_review:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Игра отличная для своего жанра (АНИМЕ-ПЛАТФОРМЕР-ГОЛОВОЛОМКА НАХУЙ), 10 НЯ из 10, да...."}]}]}',
		item_rating: 5,
		ladder_from: null,
		ladder_to: null,
		snake_from: null,
		snake_to: null,
		item_length: '3-15',
		item_duration: 11285,
		cover_image_url: 'https://howlongtobeat.com/games/38029_Nier_Automata.jpg?width=250',
		vod_links:
			'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
		game_id: 1,
		updated_at: 1759051743,
		difficulty_level: 2
	},

	{
		player_slug: 'player_2',
		created_at: 1759051743,
		id: 4,
		item_title: 'Соник',
		type: 'completed',
		dice_roll_id: 3,
		dice_roll_sum: 10,
		dice_roll: [5, 5],
		cell_to: 11,
		cell_from: 8,
		item_review:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Игра отличная для своего жанра (АНИМЕ-ПЛАТФОРМЕР-ГОЛОВОЛОМКА НАХУЙ), 10 НЯ из 10, да...."}]}]}',
		item_rating: 5,
		ladder_from: null,
		ladder_to: null,
		snake_from: null,
		snake_to: null,
		item_length: '30+',
		item_duration: 11285,
		cover_image_url: 'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
		vod_links:
			'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
		difficulty_level: -1,
		game_id: 2,
		updated_at: 1759051743
	},

	{
		player_slug: 'player_1',
		created_at: 1752905743,
		id: 5,
		item_title: 'Witcher 3: Wild Hunt',
		type: 'completed',
		dice_roll_id: 8,
		dice_roll_sum: 10,
		dice_roll: [4, 6],
		cell_to: 11,
		cell_from: 3,
		item_review:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Игра отличная для своего жанра (АНИМЕ-ПЛАТФОРМЕР-ГОЛОВОЛОМКА НАХУЙ), 10 НЯ из 10, да...."}]}]}',
		item_rating: 5,
		ladder_from: null,
		ladder_to: null,
		snake_from: null,
		snake_to: null,
		item_length: '15-30',
		item_duration: 11285,
		cover_image_url: 'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
		vod_links:
			'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
		difficulty_level: 0,
		game_id: 3,
		updated_at: 1759051743
	},

	{
		player_slug: 'player_2',
		created_at: 1759051743,
		id: 6,
		item_title: 'Соник',
		type: 'completed',
		dice_roll_id: 10,
		dice_roll_sum: 5,
		dice_roll: [2, 3],
		cell_to: 3,
		cell_from: 11,
		item_review:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Игра отличная для своего жанра (АНИМЕ-ПЛАТФОРМЕР-ГОЛОВОЛОМКА НАХУЙ), 10 НЯ из 10, да...."}]}]}',
		item_rating: 5,
		ladder_from: null,
		ladder_to: null,
		snake_from: null,
		snake_to: null,
		item_length: '15-30',
		item_duration: 11285,
		cover_image_url: 'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
		vod_links:
			'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
		difficulty_level: 0,
		game_id: 2,
		updated_at: 1759051743
	},
	{
		player_slug: 'player_4',
		created_at: 1759051743,
		id: 7,
		item_title: 'Соник',
		type: 'completed',
		dice_roll_id: 10,
		dice_roll: [5, 5],
		dice_roll_sum: 10,
		cell_to: 3,
		cell_from: 11,
		item_review:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Игра отличная для своего жанра (АНИМЕ-ПЛАТФОРМЕР-ГОЛОВОЛОМКА НАХУЙ), 10 НЯ из 10, да...."}]}]}',
		item_rating: 5,
		ladder_from: null,
		ladder_to: null,
		snake_from: null,
		snake_to: null,
		item_length: '15-30',
		item_duration: 11285,
		cover_image_url: 'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
		vod_links:
			'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
		difficulty_level: 0,
		game_id: 2,
		updated_at: 1759051743
	},
	{
		player_slug: 'player_4',
		created_at: 1759051743,
		id: 8,
		item_title: 'Соник',
		type: 'completed',
		dice_roll_id: 10,
		dice_roll_sum: 5,
		dice_roll: [4, 1],
		cell_to: 3,
		cell_from: 11,
		item_review:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Игра отличная для своего жанра (АНИМЕ-ПЛАТФОРМЕР-ГОЛОВОЛОМКА НАХУЙ), 10 НЯ из 10, да...."}]}]}',
		item_rating: 5,
		ladder_from: null,
		ladder_to: null,
		snake_from: null,
		snake_to: null,
		item_length: '15-30',
		item_duration: 11285,
		cover_image_url: 'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
		vod_links:
			'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
		difficulty_level: 0,
		game_id: 2,
		updated_at: 1759051743
	},
	{
		player_slug: 'player_4',
		created_at: 1759051743,
		id: 9,
		item_title: 'Fallout 4',
		type: 'drop',
		dice_roll_id: 5,
		dice_roll_sum: 7,
		dice_roll: [3, 4],
		cell_to: 13,
		cell_from: 18,
		item_review:
			'{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Игра отличная для своего жанра (АНИМЕ-ПЛАТФОРМЕР-ГОЛОВОЛОМКА НАХУЙ), 10 НЯ из 10, да...."}]}]}',
		item_rating: 5,
		ladder_from: null,
		ladder_to: null,
		snake_from: null,
		snake_to: null,
		item_length: '15-30',
		item_duration: 11285,
		cover_image_url: 'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
		vod_links:
			'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
		difficulty_level: 0,
		game_id: 2,
		updated_at: 1759051743
	}
]

export function playerStatsMock() {
	return playersMock.map((player) => ({
		player_slug: player.slug,
		map_position: randomInt(1, 101),
		total_moves: randomInt(1, 100),
		games_completed: randomInt(1, 30),
		games_dropped: randomInt(1, 20),
		sheikh_moments: randomInt(1, 20),
		rerolls: randomInt(1, 20),
		movies: randomInt(1, 10),
		ladders: randomInt(1, 20),
		snakes: randomInt(1, 20),
		tiny_games: randomInt(1, 20),
		short_games: randomInt(1, 20),
		medium_games: randomInt(1, 20),
		long_games: randomInt(1, 20),
		average_dice_roll: randomInt(1, 6),
		average_move: randomInt(1, 10),
		ladders_moves_sum: randomInt(1, 100),
		snakes_moves_sum: randomInt(1, 100)
	}))
}

export const mockGamesData = [
	{
		gameName: `Worms 3d`,
		box_art_url: `https://static-cdn.jtvnw.net/ttv-boxart/${1}-{width}x{height}.jpg`,
		id: 1
	},
	{
		gameName: `Earthworm Jim`,
		box_art_url: `https://static-cdn.jtvnw.net/ttv-boxart/${2}-{width}x{height}.jpg`,
		id: 2
	},
	{
		gameName: `Worms World Party`,
		box_art_url: `https://static-cdn.jtvnw.net/ttv-boxart/${3}-{width}x{height}.jpg`,
		id: 3
	},
	{
		gameName: `Worms Armageddon`,
		box_art_url: `https://static-cdn.jtvnw.net/ttv-boxart/${4}-{width}x{height}.jpg`,
		id: 4
	}
]
