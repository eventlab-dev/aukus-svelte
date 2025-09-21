import { goto } from '$app/navigation'
import { EventlabBaseUrl, queryClient } from '$lib/client'
import type { UserItem } from '$lib/heyapi'
import {
	fetchCurrentUserApiUsersCurrentGetQueryKey,
	getUsersApiUsersGetOptions,
	getUsersApiUsersGetQueryKey,
	loginApiLoginPostMutation
} from '$lib/heyapi/@tanstack/svelte-query.gen'
import { createMutation, createQuery } from '@tanstack/svelte-query'
import { get } from 'svelte/store'

class UsersStore {
	private _my_user = $state<UserItem | null>(null)
	private _users = $state<UserItem[]>([])

	private _users_query = createQuery({
		...getUsersApiUsersGetOptions({ baseUrl: EventlabBaseUrl }),
		refetchInterval: 60000
	})
	private _login_mutation = createMutation({
		...loginApiLoginPostMutation({ baseUrl: EventlabBaseUrl })
	})

	constructor() {
		this._users_query.subscribe((query) => {
			this._users = query.data?.users ?? []
		})
	}

	refetchUsers() {
		return queryClient.refetchQueries({ queryKey: getUsersApiUsersGetQueryKey() })
	}

	refetchMyUser() {
		return queryClient.refetchQueries({
			queryKey: fetchCurrentUserApiUsersCurrentGetQueryKey({
				baseUrl: EventlabBaseUrl
			})
		})
	}

	login(name: string, pass: string) {
		get(this._login_mutation)
			.mutateAsync({ body: { username: name, password: pass } })
			.then((response) => {
				if (response.token) {
					localStorage.setItem('auth_token', response.token)
				}
				this.refetchMyUser().then(() => {
					goto('/')
				})
			})
	}

	logout() {
		localStorage.removeItem('auth_token')
		this._my_user = null
	}

	setMyUser(user: UserItem | null) {
		this._my_user = user
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
}

export default UsersStore
