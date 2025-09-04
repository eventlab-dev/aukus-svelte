import { dev } from '$app/environment';
import { playersMock, playerStatsMock, playerMovesData, mockGamesData } from './mockData';
import { randomInt } from '../../utils';
import type { CurrentUser, DiceRollParams, DiceRollResponse, GamesResponse, PlayerMoveRequest, PlayerMovesParams, PlayerMovesResponse, PlayersResponse, ResetPointaucTokenResponse, RulesItem, SponsorsResponse, StatsResponse, UpdateCurrentGameParams, UpdateLinkParams } from './types';

class AukusApi {
	public async fetchPlayers(move_id?: number): Promise<PlayersResponse> {
		if (dev) {
			console.log('fetching players', move_id);
			return new Promise<PlayersResponse>((resolve) =>
				setTimeout(() => resolve({ players: playersMock }), 2000)
			);
		}

		if (move_id) {
			return fetch(`/api/players?move_id=${move_id}`).then((res) => res.json());
		}

		return fetch(`/api/players`).then((res) => res.json());
	}

	public async createPlayerMove(move: PlayerMoveRequest): Promise<void> {
		if (dev) {
			console.log('creating player move', move);
			return Promise.resolve();
		}

		return fetch(`/api/player_move`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(move),
		}).then((res) => res.json());
	}

	public async fetchCurrentUser(): Promise<CurrentUser> {
		if (dev) {
			console.log('fetching current user')
			// return Promise.reject({ error: 'auth required' })
			return Promise.resolve({
				user_id: 1,
				role: 'player',
				moder_for: undefined,
				url_handle: 'lasqa',
				name: 'Lasqa',
			});
		}

		return fetch(`/api/current_user`).then((res) => {
			if (res.status !== 200) {
				throw new Error('auth required')
			}

			return res.json();
		});
	}

	public async fetchStats(): Promise<StatsResponse> {
		if (dev) {
			console.log('fetching stats');
			return Promise.resolve({
				players: playerStatsMock(),
			});
		}

		return fetch(`/api/player_stats`).then((res) => res.json());
	}

	public async fetchGameNames(name: string): Promise<GamesResponse> {
		if (dev) {
			console.log('fetching game names', name);
			return Promise.resolve({ games: mockGamesData });
		}

		return fetch(`/api/games?title=${name}`).then((res) => res.json());
	}

	public async updateVodLink({
		move_id,
		link,
		title,
	}: UpdateLinkParams): Promise<void> {
		if (dev) {
			console.log('setting vod link', link);
			return Promise.resolve();
		}

		return fetch(`/api/player_move_vod_link`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ move_id, vod_link: link, title }),
		}).then((res) => res.json());
	}

	public async fetchPlayerMoves({
		id,
		date,
		limit,
	}: PlayerMovesParams): Promise<PlayerMovesResponse> {
		if (dev) {
			console.log('fetching player moves', id);
			return Promise.resolve({ moves: playerMovesData });
		}

		if (id) {
			return fetch(`/api/moves?player_id=${id}`).then((res) => res.json());
		}

		if (date) {
			return fetch(`/api/moves?date=${date}`).then((res) => res.json());
		}

		return fetch(`/api/moves?limit=${limit || 10}`).then((res) => res.json());
	}

	public async resetPointaucToken(): Promise<ResetPointaucTokenResponse> {
		if (dev) {
			console.log('resetting token');
			return Promise.resolve({ token: 'xxx' });
		}

		return fetch('/api/reset_pointauc_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		}).then((res) => res.json());
	}

	public async updateCurrentGame({
		player_id,
		title,
	}: UpdateCurrentGameParams): Promise<void> {
		if (dev) {
			console.log('updating current game', player_id, title)
			return Promise.resolve()
		}

		return fetch(`/api/player_current_game`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ player_id, title }),
		}).then((res) => res.json());
	}

	public async fetchSponsors(): Promise<SponsorsResponse> {
		if (dev) {
			return Promise.resolve({
				dons: [
					{
						name: 'Юзя',
						type: 'big',
						text: 'Спасибо вам всем огромное от всей души за сайт и интеграцию с поинтауком! Спасибо вам огромное за сайт',
					},
					{
						name: 'CruxTerminatus',
						type: 'big',
						text: 'а я еще дам деняк на пиво (или не на пиво)',
					},
					{ name: 'Tsessarsky', type: 'small', text: 'Спасибо за ивент!' },
				],
			});
		}

		return fetch('/api/dons').then((res) => res.json());
	}

	public async fetchRules(): Promise<RulesItem> {
		if (dev) {
			const data = {
				ops: [
					{ insert: 'test ' },
					{ attributes: { underline: true }, insert: 'value' },
					{ insert: '\nline1\nline2\nline3\n\n' },
				],
			}

			return Promise.resolve({
				rules_data: JSON.stringify(data),
				version: '2025-01-10 13:14:15',
			});
		}

		return fetch('/api/rules').then((res) => res.json());
	}

	public async updateRules(rules: string): Promise<void> {
		if (dev) return Promise.resolve();

		return fetch('/api/rules', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ rule_data: rules }),
		}).then((res) => res.json());
	}

	public async makeDiceRoll(params: DiceRollParams): Promise<DiceRollResponse> {
		if (dev) {
			return Promise.resolve({
				data: Array.from({ length: params.num }, () => randomInt(params.min, params.max)),
				isRandomOrgResult: true,
				randomOrgCheckForm: 'https://api.random.org',
			});
		}

		return fetch('/api/random', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(params),
		}).then((res) => res.json());
	}
}

const aukusApi = new AukusApi();

export default aukusApi;
