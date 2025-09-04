import { randomInt } from "../../utils"
import type { Player, PlayerMove } from "./types"

const playerLasqa: Player = {
  id: 1,
  name: 'Lasqa',
  twitch_stream_link: '',
  vk_stream_link: '',
  total_score: 800,
  avatar_link: '',
  donation_link: 'https://www.donationalerts.com/r/lasqa',
  kick_stream_link: 'https://live.kickplay.ru/lasqa',
  url_handle: 'lasqa',
  map_position: 0,
  current_game: 'Baldur\'s Gate 3',
  current_game_duration: 37334,
  is_online: false,
  stream_last_category: 'Gothic',
  first_name: 'Богдан',
  last_name: '',
  telegram_link: 'https://t.me/lasqa',
  current_game_updated_at: '2025-09-02 12:14:15',
  current_game_image:
    'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
}

const playerSegall: Player = {
  id: 2,
  name: 'Segall',
  total_score: 700,
  avatar_link: '',
  twitch_stream_link: 'https://www.twitch.tv/segall',
  vk_stream_link: 'https://live.vkplay.ru/segall',
  donation_link: 'https://www.donationalerts.com/r/segall',
  kick_stream_link: '',
  current_game: '',
  url_handle: 'segall',
  map_position: 8,
  is_online: false,
  stream_last_category: 'Just Chatting',
  first_name: 'Александр',
  last_name: '',
  telegram_link: 'https://t.me/segall',
  current_game_updated_at: '2024-10-11 12:14:15',
  current_game_image:
    'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
  auction_timer_started_at: 'Sat, 07 Dec 2024 19:25:04 GMT',
}

const playerRoadhouse: Player = {
  id: 3,
  name: 'Roadhouse',
  total_score: 600,
  avatar_link: '',
  twitch_stream_link: 'https://www.twitch.tv/roadhouse',
  vk_stream_link: 'https://live.vkplay.ru/roadhouse',
  donation_link: 'https://www.donationalerts.com/r/roadhouse',
  kick_stream_link: '',
  url_handle: 'roadhouse',
  map_position: 6,
  current_game: 'Call of Duty: Black Ops Cold War',
  is_online: true,
  online_count: 1146,
  stream_last_category: 'Witcher',
  first_name: 'Андрей',
  last_name: '',
  telegram_link: 'https://t.me/roadhouse',
  current_game_updated_at: '2024-10-11 12:14:15',
  current_game_image:
    'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
}

const playerPraden: Player = {
  id: 4,
  name: 'Praden',
  total_score: 500,
  avatar_link: '',
  twitch_stream_link: 'https://www.twitch.tv/roadhouse',
  vk_stream_link: 'https://live.vkplay.ru/roadhouse',
  donation_link: 'https://www.donationalerts.com/r/roadhouse',
  kick_stream_link: '',
  url_handle: 'praden',
  map_position: 6,
  current_game: 'Готика',
  is_online: true,
  online_count: 864,
  stream_last_category: 'Witcher',
  first_name: 'Денис',
  last_name: '',
  telegram_link: 'https://t.me/roadhouse',
  current_game_updated_at: '2024-10-11 12:14:15',
  current_game_image:
    'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
  current_game_duration: 18034,
}

export const playersMock = [
  playerLasqa,
  playerSegall,
  playerRoadhouse,
  playerPraden,
].toSorted((a, b) => {
  if (a.name > b.name) {
    return 1
  } else {
    return -1
  }
});

export const playerMovesData: PlayerMove[] = [
  {
    player_move_id: 1,
    player_id: 1,
    created_at: '2024-12-04',
    id: 1,
    item_title: 'NieR: Automata (2017)',
    type: 'completed',
    dice_roll: 3,
    cell_to: 3,
    cell_from: 0,
    item_review: 'Прекрасная история рассказанная великолепным Йоко Оно, про то как секс-роботы остались единственной живой сущностью на планете. Они защищали уже вымершее человечество, которое до этого спускало в них семя. Они научились любить, быть друзьями и умирать. Но лучше я буду просто дрочить на порнуху с косплеем 2б. чем играть в этот шедевр.',
    item_rating: 5,
    stair_from: null,
    stair_to: null,
    snake_from: null,
    snake_to: null,
    item_length: 'medium',
    stream_title_category_duration: '11285',
    item_image:
      'https://howlongtobeat.com/games/38029_Nier_Automata.jpg?width=250',
    vod_link:
      'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
  },

  {
    player_move_id: 1,
    player_id: 2,
    created_at: '2024-12-06',
    id: 2,
    item_title: 'NieR: Automata (2017)',
    type: 'drop',
    dice_roll: 3,
    cell_to: 3,
    cell_from: 0,
    item_review: 'Прекрасная история рассказанная великолепным Йоко Оно, про то как секс-роботы остались единственной живой сущностью на планете. Они защищали уже вымершее человечество, которое до этого спускало в них семя. Они научились любить, быть друзьями и умирать. Но лучше я буду просто дрочить на порнуху с косплеем 2б. чем играть в этот шедевр.',
    item_rating: 5,
    stair_from: null,
    stair_to: null,
    snake_from: null,
    snake_to: null,
    item_length: 'medium',
    stream_title_category_duration: '11285',
    item_image:
      'https://howlongtobeat.com/games/38029_Nier_Automata.jpg?width=250',
    vod_link:
      'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
  },
  {
    player_move_id: 1,
    player_id: 3,
    created_at: '2024-12-06',
    id: 3,
    item_title: 'NieR: Automata (2017)',
    type: 'reroll',
    dice_roll: 3,
    cell_to: 3,
    cell_from: 0,
    item_review: 'Прекрасная история рассказанная великолепным Йоко Оно, про то как секс-роботы остались единственной живой сущностью на планете. Они защищали уже вымершее человечество, которое до этого спускало в них семя. Они научились любить, быть друзьями и умирать. Но лучше я буду просто дрочить на порнуху с косплеем 2б. чем играть в этот шедевр.',
    item_rating: 5,
    stair_from: null,
    stair_to: null,
    snake_from: null,
    snake_to: null,
    item_length: 'medium',
    stream_title_category_duration: '11285',
    item_image:
      'https://howlongtobeat.com/games/38029_Nier_Automata.jpg?width=250',
    vod_link:
      'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
  },

  {
    player_move_id: 2,
    player_id: 2,
    created_at: '2024-12-04',
    id: 4,
    item_title: 'Соник',
    type: 'completed',
    dice_roll: 3,
    cell_to: 11,
    cell_from: 8,
    item_review:
      'Фильм «Вася не в себе» (2023). Добрая комедия про важность таджиков с Павлом Прилучным. 5/10 ))) ',
    item_rating: 5,
    stair_from: null,
    stair_to: null,
    snake_from: null,
    snake_to: null,
    item_length: 'medium',
    stream_title_category_duration: '11285',
    item_image:
      'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
    vod_link:
      'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
  },

  {
    player_move_id: 3,
    player_id: 1,
    created_at: '2024-12-04',
    id: 5,
    item_title: 'Witcher 3: Wild Hunt',
    type: 'completed',
    dice_roll: 8,
    cell_to: 11,
    cell_from: 3,
    item_review: 'ПРОЙДЕНО: ИГРУШКА-ПРИКОЛЮХА, ЖАЛЬ ПРИШЛОСЬ РАШИТЬ ',
    item_rating: 5,
    stair_from: null,
    stair_to: null,
    snake_from: null,
    snake_to: null,
    item_length: 'medium',
    stream_title_category_duration: '11285',
    item_image:
      'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
    vod_link:
      'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
  },

  {
    player_move_id: 4,
    player_id: 2,
    created_at: '2024-12-04',
    id: 6,
    item_title: 'Соник',
    type: 'completed',
    dice_roll: 10,
    cell_to: 3,
    cell_from: 11,
    item_review:
      'Фильм «Вася не в себе» (2023). Добрая комедия про важность таджиков с Павлом Прилучным. 5/10 ))) ',
    item_rating: 5,
    stair_from: null,
    stair_to: null,
    snake_from: null,
    snake_to: null,
    item_length: 'medium',
    stream_title_category_duration: '11285',
    item_image:
      'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
    vod_link:
      'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
  },
  {
    player_move_id: 4,
    player_id: 4,
    created_at: '2025-09-03',
    id: 7,
    item_title: 'Соник',
    type: 'completed',
    dice_roll: 10,
    cell_to: 3,
    cell_from: 11,
    item_review:
      'Фильм «Вася не в себе» (2023). Добрая комедия про важность таджиков с Павлом Прилучным. 5/10 ))) ',
    item_rating: 5,
    stair_from: null,
    stair_to: null,
    snake_from: null,
    snake_to: null,
    item_length: 'medium',
    stream_title_category_duration: '11285',
    item_image:
      'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
    vod_link:
      'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
  },
  {
    player_move_id: 4,
    player_id: 4,
    created_at: '2025-07-15',
    id: 8,
    item_title: 'Соник',
    type: 'completed',
    dice_roll: 10,
    cell_to: 3,
    cell_from: 11,
    item_review:
      'Фильм «Вася не в себе» (2023). Добрая комедия про важность таджиков с Павлом Прилучным. 5/10 ))) ',
    item_rating: 5,
    stair_from: null,
    stair_to: null,
    snake_from: null,
    snake_to: null,
    item_length: 'medium',
    stream_title_category_duration: '11285',
    item_image:
      'https://static-cdn.jtvnw.net/ttv-boxart/Valheim-{width}x{height}.jpg',
    vod_link:
      'test link 1\nДень 1 https://twitch.com/lasqa\nЧасть 2 https://youtube.com/test\ntest link 2\ntest field',
  },
]

export function playerStatsMock() {
  return playersMock.map((player) => ({
    id: player.id,
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
    snakes_moves_sum: randomInt(1, 100),
  }))
}

export const mockGamesData = [
  {
    gameName: `Worms 3d`,
    box_art_url: `https://static-cdn.jtvnw.net/ttv-boxart/${1}-{width}x{height}.jpg`,
    id: 1,
  },
  {
    gameName: `Earthworm Jim`,
    box_art_url: `https://static-cdn.jtvnw.net/ttv-boxart/${2}-{width}x{height}.jpg`,
    id: 2,
  },
  {
    gameName: `Worms World Party`,
    box_art_url: `https://static-cdn.jtvnw.net/ttv-boxart/${3}-{width}x{height}.jpg`,
    id: 3,
  },
  {
    gameName: `Worms Armageddon`,
    box_art_url: `https://static-cdn.jtvnw.net/ttv-boxart/${4}-{width}x{height}.jpg`,
    id: 4,
  },
]
