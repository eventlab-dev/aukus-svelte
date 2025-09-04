import type { CurrentUser } from "$lib/api/aukus/types";

class UserStore {
	private _user = $state<CurrentUser | null>({
		name: 'Lasqa',
		role: 'player',
		user_id: 1,
	});
	// private _user = $state<CurrentUser | null>({
	// 	name: 'qwe',
	// 	role: 'moder',
	// 	user_id: 33,
	// 	moder_for: 2
	// });
	// private _user = $state<CurrentUser | null>(null);

	setUser(user: CurrentUser) {
		this._user = user;
	}

	get user() { return this._user }
	get isPlayer() { return (this.user?.role === 'player') }
	get isModerator() { return (this.user?.role === 'moder') }
}

export default UserStore;
