import PlayersMovesStore from "./PlayersMovesStore.svelte";
import PlayersStore from "./PlayersStore.svelte";
import UserStore from "./UserStore.svelte";

export class AppManager {
	readonly userStore = new UserStore();
	readonly playersStore = new PlayersStore();
	readonly playersMovesStore = new PlayersMovesStore();
}

export default AppManager;
