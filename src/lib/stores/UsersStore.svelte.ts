import { EventlabBaseUrl } from '$lib/client'
import { DEFAULT_REFETCH } from '$lib/constants'
import {
	fetchCurrentUserApiUsersCurrentGetOptions,
	getUsersApiUsersGetOptions,
	loginApiLoginPostMutation
} from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import { defaultAuth } from '$lib/utils'
import { createMutation, createQuery } from '@tanstack/svelte-query'
import { SvelteMap } from 'svelte/reactivity'

export class UsersStore {
	accessToken = $state<string | null>(
		typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null
	)

	myUserQuery = createQuery(() => ({
		...fetchCurrentUserApiUsersCurrentGetOptions({
			baseUrl: EventlabBaseUrl,
			auth: defaultAuth,
			credentials: 'include'
		}),
		retry: false,
		enabled: Boolean(this.accessToken),
		refetchOnWindowFocus: false
	}))

	loginMutation = createMutation(() =>
		loginApiLoginPostMutation({ baseUrl: EventlabBaseUrl, credentials: 'include' })
	)

	myUser = $derived.by(() => {
		if (this.myUserQuery.isSuccess) {
			return this.myUserQuery.data ?? null
		}
		return null
	})
	isAdmin = $derived(this.myUser?.roles.includes('admin') ?? false)

	loginError = $state<string | null>(null)

	async login(username: string, password: string) {
		this.loginError = null

		try {
			const response = await this.loginMutation.mutateAsync({ body: { username, password } })

			if (response.token) {
				localStorage.setItem('auth_token', response.token)
				this.accessToken = response.token
				await this.myUserQuery.refetch()
				return true
			}
		} catch (error) {
			let statusCode = 0
			if (error && typeof error === 'object') {
				const errorObj = error as Record<string, unknown>
				if ('response' in errorObj && errorObj.response instanceof Response) {
					statusCode = errorObj.response.status
				}
			}

			const errorMessage =
				statusCode === 401
					? 'Неверный логин или пароль'
					: `Неизвестная ошибка при входе (${statusCode})`

			this.loginError = errorMessage
			return false
		}
	}

	logout() {
		localStorage.removeItem('auth_token')
		this.accessToken = null

		this.myUserQuery.refetch()
	}

	usersQuery = createQuery(() => ({
		...getUsersApiUsersGetOptions({
			baseUrl: EventlabBaseUrl,
			query: { is_active: 1, events: ['aukus4'] }
		}),
		refetchInterval: DEFAULT_REFETCH,
		refetchOnWindowFocus: false
	}))

	users = $derived(this.usersQuery.data?.users ?? [])
	usersBySlug = $derived(new SvelteMap(this.users.map((user) => [user.slug, user])))
}
