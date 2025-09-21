import { getAppManagerContext } from '$lib/contexts/appManagerContext'
import type { UserItem } from '$lib/heyapi'
import {
	fetchCurrentUserApiUsersCurrentGetOptions,
	fetchCurrentUserApiUsersCurrentGetQueryKey,
	getUsersApiUsersGetOptions,
	getUsersApiUsersGetQueryKey
} from '$lib/heyapi/@tanstack/svelte-query.gen'
import { createQuery } from '@tanstack/svelte-query'

class UsersStore {
	private _my_user = $state<UserItem | null>(null)
	private _users = $state<UserItem[]>([])
	// private _user = $state<CurrentUser | null>({
	// 	name: 'Lasqa',
	// 	role: 'player',
	// 	user_id: 1,
	// });
	// private _user = $state<CurrentUser | null>({
	// 	name: 'qwe',
	// 	role: 'moder',
	// 	user_id: 33,
	// 	moder_for: 2
	// });
	// private _user = $state<CurrentUser | null>(null);

	// setUser(user: CurrentUser) {
	// 	this._user = user
	// }

	private _users_query = createQuery(getUsersApiUsersGetOptions())
	private _current_user_query = createQuery(fetchCurrentUserApiUsersCurrentGetOptions())

	constructor() {
		this._current_user_query.subscribe((data) => {
			this._my_user = data.data ?? null
		})
		this._users_query.subscribe((data) => {
			this._users = data.data?.users ?? []
		})
	}

	refetchUsers() {
		getAppManagerContext().queryClient.refetchQueries({ queryKey: getUsersApiUsersGetQueryKey() })
	}

	refetchMyUser() {
		getAppManagerContext().queryClient.refetchQueries({
			queryKey: fetchCurrentUserApiUsersCurrentGetQueryKey()
		})
	}

	get myUser() {
		return this._my_user
	}
	get isPlayer() {
		return this._my_user?.role === 'streamer'
	}
	get isModerator() {
		return false
		// return this._my_user?.role === 'moder'
	}
	get isAdmin() {
		return this._my_user?.role === 'admin'
	}
	get users_query() {
		return this._users_query
	}
	get current_user_query() {
		return this._current_user_query
	}
}

export default UsersStore
