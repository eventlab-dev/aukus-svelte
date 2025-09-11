import type { PlayerUrl } from "$lib/types";

export type MoveType = 'completed' | 'drop' | 'sheikh' | 'reroll' | 'movie';
export type DiceOption = '1d6' | '2d6' | '3d6' | '1d8' | '1d4';
export type DiceOrSkip = DiceOption | 'skip';
export type ItemLength = 'tiny' | 'short' | 'medium' | 'long';

export type NextTurnParams = {
	diceRoll: number;
	stairFrom: number | null;
	stairTo: number | null;
	snakeFrom: number | null;
	snakeTo: number | null;
	type: MoveType;
	itemTitle: string;
	itemReview: string;
	itemRating: number;
	itemLength: ItemLength | null;
}

export type MoveParams = {
	steps: number;
	skipLadders: boolean;
	cellFrom?: number;
}

export type Player = {
	id: number;
	name: string;
	avatar_link: string;
	total_score: number;
	twitch_stream_link: string;
	vk_stream_link: string;
	kick_stream_link: string;
	donation_link: string;
	telegram_link: string;
	is_online: boolean;
	current_game: string | null;
	current_game_updated_at: string;
	current_game_image: string | null;
	url_handle: PlayerUrl;
	map_position: number;
	stream_last_category: string;
	first_name: string;
	last_name: string;
	online_count?: number;
	auction_timer_started_at?: string;
	current_game_duration?: number;
}

export type PlayerStats = {
	id: number;
	map_position: number;
	total_moves: number;
	games_completed: number;
	games_dropped: number;
	sheikh_moments: number;
	rerolls: number;
	movies: number;
	ladders: number;
	snakes: number;
	tiny_games: number;
	short_games: number;
	medium_games: number;
	long_games: number;
	average_dice_roll: number;
	average_move: number;
	ladders_moves_sum: number;
	snakes_moves_sum: number;
}

export type PlayerMove = {
	id: number;
	player_id: number;
	created_at: string;
	dice_roll: number;
	cell_from: number;
	cell_to: number;
	stair_from: number | null;
	stair_to: number | null;
	snake_from: number | null;
	snake_to: number | null;
	type: MoveType;
	item_title: string;
	item_review: string;
	item_rating: number;
	item_image: string | null;
	item_length: ItemLength | null;
	vod_link: string | null;
	player_move_id: number;
	stream_title_category_duration: number | string;
}

export type PlayerMoveRequest = {
	player_id: number;
	dice_roll: number;
	move_to: number;
	stair_from: number | null;
	stair_to: number | null;
	snake_from: number | null;
	snake_to: number | null;
	type: MoveType;
	item_title: string;
	item_review: string;
	item_rating: number;
	item_length: ItemLength | null;
}

export type PlayersResponse = {
	players: Array<Player>;
}

export type RulesItem = {
	rules_data: string;
	version: string;
}

export type StatsResponse = {
	players: Array<PlayerStats>;
}

export type Game = {
	gameName: string;
	box_art_url: string;
}

export type GamesResponse = {
	games: Game[];
}

export type UpdateLinkParams = {
	move_id: number;
	link: string;
	title: string;
}

export type PlayerMovesResponse = {
	moves: Array<PlayerMove>;
	last_move_id?: number;
}

export type PlayerMovesParams = {
	id?: number;
	date?: string;
	limit?: number;
}

export type ResetPointaucTokenResponse = {
	token: string;
}

export type UpdateCurrentGameParams = {
	player_id: number;
	title: string;
}

export type Sponsor = {
	name: string;
	text?: string;
	type: 'big' | 'small';
}

export type SponsorsResponse = {
	dons: Sponsor[];
}

export type DiceRollParams = {
	num: number;
	min: number;
	max: number;
	is_test: boolean;
}

export type DiceRollResponse = {
	data: number[];
	isRandomOrgResult: boolean;
	randomOrgCheckForm: string;
}

export type CurrentUser = {
	user_id: number;
	role: 'player' | 'moder' | 'admin';
	moder_for?: number;
	name: string;
}

export type PreviousGame = {
	title: string;
	rating: string;
	review: string;
	status: 'completed' | 'drop' | 'movie' | 'reroll';
}

export type GamesItem = {
	games: PreviousGame[];
	link: string;
}

export type Achievement = {
	name: string;
	image: string;
	description: string;
	reward: string;
	players_ids: number[];
};
