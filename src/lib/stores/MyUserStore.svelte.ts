import { goto } from '$app/navigation'
import { EventlabBaseUrl } from '$lib/client'
import {
	fetchCurrentUserApiUsersCurrentGetOptions,
	loginApiLoginPostMutation
} from '$lib/heyapi/@tanstack/svelte-query.gen'
import { createMutation, createQuery } from '@tanstack/svelte-query'
import { derived, get } from 'svelte/store'

export function createMyUserStore() {
	const myUserQuery = createQuery({
		...fetchCurrentUserApiUsersCurrentGetOptions({
			baseUrl: EventlabBaseUrl,
			auth: () => localStorage.getItem('auth_token') ?? undefined
		}),
		retry: false
	})

	const loginMutation = createMutation({
		...loginApiLoginPostMutation({ baseUrl: EventlabBaseUrl })
	})

	const myUser = derived(myUserQuery, ($query) => {
		if ($query.isSuccess) {
			return $query.data
		}
		return null
	})
	const isLoading = derived(myUserQuery, ($query) => $query.isLoading)

	const isAdmin = derived(myUser, ($myUser) => $myUser?.role === 'admin')
	const isPlayer = derived(myUser, ($myUser) => $myUser?.role === 'streamer')
	const isModerator = derived(myUser, () => false)

	const login = (username: string, password: string) => {
		get(loginMutation)
			.mutateAsync({ body: { username, password } })
			.then((response) => {
				if (response.token) {
					localStorage.setItem('auth_token', response.token)
				}
				get(myUserQuery)
					.refetch()
					.then(() => {
						goto('/')
					})
			})
	}

	const logout = () => {
		localStorage.removeItem('auth_token')
		get(myUserQuery).refetch()
	}

	return {
		myUser,
		isLoading,
		isAdmin,
		isPlayer,
		isModerator,
		login,
		logout
	}
}
