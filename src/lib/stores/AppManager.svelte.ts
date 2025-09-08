import PlayersMovesStore from "./PlayersMovesStore.svelte";
import PlayersStore from "./PlayersStore.svelte";
import UserStore from "./UserStore.svelte";

export class AppManager {
	readonly userStore = new UserStore();
	readonly playersStore = new PlayersStore();
	readonly playersMovesStore = new PlayersMovesStore();

	readonly myPlayer = $derived.by(this._getMyPlayer.bind(this));

	private _getMyPlayer() {
		if (!this.userStore.user) return null;

		return this.playersStore.playersById[this.userStore.user.user_id];
	}
}

export default AppManager;
