import { playersMock } from "$lib/api/aukus/mockData";
import type { Player } from "$lib/api/aukus/types";

class PlayersStore {
	private _players: Player[] = $state(playersMock);
	readonly playersByUrlHandle = $derived.by(this._getPlayersByUrlHandle.bind(this));
	readonly playersById = $derived.by(this._getPlayersById.bind(this));

	public getPlayer(id: number) {
		return this._players.find((player) => player.id === id);
	}

	private _getPlayersByUrlHandle() {
		return playersMock.reduce((acc, player) => {
			acc[player.url_handle] = player;
			return acc;
		}, {} as Record<string, Player>);
	}
	private _getPlayersById() {
		return playersMock.reduce((playersById, player) => {
			playersById[player.id] = player;
			return playersById;
		}, {} as Record<number, Player>);
	}

	get players() { return this._players };
}

export default PlayersStore;
