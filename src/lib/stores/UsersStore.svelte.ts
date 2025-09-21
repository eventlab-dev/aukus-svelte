import { goto } from '$app/navigation'
import { EventlabBaseUrl, queryClient } from '$lib/client'
import type { UserItem } from '$lib/heyapi'
import {
	fetchCurrentUserApiUsersCurrentGetOptions,
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
	private _current_user_query = createQuery({
		...fetchCurrentUserApiUsersCurrentGetOptions({
			baseUrl: EventlabBaseUrl,
			auth: () => localStorage.getItem('auth_token') ?? undefined
		}),
		retry: false
	})
	private _login_mutation = createMutation({
		...loginApiLoginPostMutation({ baseUrl: EventlabBaseUrl })
	})

	constructor() {
		this._current_user_query.subscribe((query) => {
			console.log('current user data', query)
			if (query.data) {
				this._my_user = query.data
			} else {
				this._my_user = null
			}
			console.log('this._my_user', this._my_user)
		})
		this._users_query.subscribe((query) => {
			this._users = query.data?.users ?? []
		})
	}

	refetchUsers() {
		return queryClient.refetchQueries({ queryKey: getUsersApiUsersGetQueryKey() })
	}

	refetchMyUser() {
		return queryClient.refetchQueries({
			queryKey: fetchCurrentUserApiUsersCurrentGetQueryKey()
		})
	}

	login(name: string, pass: string) {
		get(this._login_mutation)
			.mutateAsync({ body: { username: name, password: pass } })
			.then((response) => {
				console.log('after login')
				if (response.token) {
					localStorage.setItem('auth_token', response.token)
				}
				console.log('refetching')
				this.refetchMyUser().then(() => {
					console.log('redirecting')
					goto('/')
				})
			})
	}

	logout() {
		localStorage.removeItem('auth_token')
		this._my_user = null
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
