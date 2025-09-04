import { playerMovesData } from "$lib/api/aukus/mockData";
import type { PlayerMove } from "$lib/api/aukus/types";

class PlayersMovesStore {
	private _moves: PlayerMove[] = $state(playerMovesData);

	public setPlayerMoves(playerMoves: PlayerMove[]) {
		this._moves = playerMoves;
	}

	get moves() { return this._moves }
}

export default PlayersMovesStore;
