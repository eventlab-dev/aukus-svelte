import { goto } from '$app/navigation'
import { AukusBaseUrl, EventlabBaseUrl } from '$lib/client'
import { setTokenInvalidatedCallback } from '$lib/clientInterceptors'
import {
	createPlayerMoveApiPlayersMovePostMutation,
	finishPlayerMoveApiPlayersMoveFinishPostMutation,
	setPlayerSkinsApiPlayersSkinsPostMutation
} from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import {
	fetchCurrentUserApiUsersCurrentGetOptions,
	getUsersApiUsersGetOptions,
	loginApiLoginPostMutation,
	makeDiceRollApiDiceRollsPostMutation
} from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import type { UserItem } from '$lib/heyapi/eventlab/types.gen'
import { defaultAuth } from '$lib/utils'
import { createMutation, createQuery } from '@tanstack/svelte-query'
import { SvelteMap } from 'svelte/reactivity'
import { derived, get, writable } from 'svelte/store'

export function createUsersStore() {
	const accessToken = writable<string | null>(
		typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
	)

	setTokenInvalidatedCallback(() => {
		accessToken.set(null)
	})

	const myUserQuery = createQuery(
		derived(accessToken, ($token) => ({
			...fetchCurrentUserApiUsersCurrentGetOptions({
				baseUrl: EventlabBaseUrl,
				auth: defaultAuth
			}),
			retry: false,
			enabled: Boolean($token)
		}))
	)

	const loginMutation = createMutation(loginApiLoginPostMutation({ baseUrl: EventlabBaseUrl }))

	const myUser = derived([myUserQuery, accessToken], ([$query, $token]) => {
		if ($query.isSuccess && $token) {
			return $query.data
		}
		return null
	})

	const isAdmin = derived(myUser, ($myUser) => $myUser?.roles.includes('admin'))

	const loginError = writable<string | null>(null)

	const login = (username: string, password: string) => {
		loginError.set(null)
		get(loginMutation)
			.mutateAsync({ body: { username, password } })
			.then((response) => {
				if (response.token) {
					localStorage.setItem('auth_token', response.token)
					accessToken.set(response.token)
					get(myUserQuery)
						.refetch()
						.then(() => {
							goto('/')
						})
				}
			})
			.catch((error) => {
				let statusCode = 0
				
				if (error && typeof error === 'object') {
					const errorObj = error as Record<string, unknown>
					if ('response' in errorObj && errorObj.response instanceof Response) {
						statusCode = errorObj.response.status
					}
				}
				
				const errorMessage = statusCode === 401 
					? 'Неверный логин или пароль'
					: `Неизвестная ошибка при входе (${statusCode})`
				
				loginError.set(errorMessage)
			})
	}

	const logout = () => {
		localStorage.removeItem('auth_token')
		accessToken.set(null)
	}

	const usersQuery = createQuery({
		...getUsersApiUsersGetOptions({
			baseUrl: EventlabBaseUrl,
			query: { is_active: 1, events: ['aukus4'] }
		}),
		refetchInterval: 2 * 60 * 1000
	})

	const users = derived(usersQuery, ($query) => {
		if ($query.isSuccess) {
			return $query.data.users
		}
		return []
	})

	const usersBySlug = derived(users, ($users) => {
		const map = new SvelteMap<string, UserItem>()
		$users.forEach((user) => {
			map.set(user.slug, user)
		})
		return map
	})

	const saveMoveForm = createMutation(
		createPlayerMoveApiPlayersMovePostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	const finishMove = createMutation(
		finishPlayerMoveApiPlayersMoveFinishPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	const rollDice = createMutation(
		makeDiceRollApiDiceRollsPostMutation({
			baseUrl: EventlabBaseUrl,
			auth: defaultAuth
		})
	)

	const setSkins = createMutation(
		setPlayerSkinsApiPlayersSkinsPostMutation({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		})
	)

	return {
		myUserQuery,
		myUser,
		isAdmin,
		login,
		loginMutation,
		loginError,
		logout,
		users,
		usersQuery,
		usersBySlug,
		saveMoveForm,
		finishMove,
		rollDice,
		setSkins,
		accessToken
	}
}

export type UsersStore = ReturnType<typeof createUsersStore>
