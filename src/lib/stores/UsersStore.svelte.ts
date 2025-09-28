import { goto } from '$app/navigation'
import { AukusBaseUrl, EventlabBaseUrl } from '$lib/client'
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
import { derived, get } from 'svelte/store'

export function createUsersStore() {
	const myUserQuery = createQuery({
		...fetchCurrentUserApiUsersCurrentGetOptions({
			baseUrl: EventlabBaseUrl,
			auth: defaultAuth
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

	const isAdmin = derived(myUser, ($myUser) => $myUser?.role === 'admin')
	const isPlayer = derived(myUser, ($myUser) => $myUser?.role === 'streamer')
	const isModerator = derived(myUser, () => false)

	const login = (username: string, password: string) => {
		get(loginMutation)
			.mutateAsync({ body: { username, password } })
			.then((response) => {
				if (response.token) {
					localStorage.setItem('auth_token', response.token)
					get(myUserQuery)
						.refetch()
						.then(() => {
							goto('/')
						})
				}
			})
	}

	const logout = () => {
		localStorage.removeItem('auth_token')
		get(myUserQuery).refetch()
	}

	const usersQuery = createQuery({
		...getUsersApiUsersGetOptions({
			baseUrl: EventlabBaseUrl,
			query: { is_active: 1 }
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
		isPlayer,
		isModerator,
		login,
		logout,
		users,
		usersQuery,
		usersBySlug,
		saveMoveForm,
		finishMove,
		rollDice,
		setSkins
	}
}
