import { EventlabBaseUrl, queryClient } from '$lib/client'
import { DEFAULT_REFETCH } from '$lib/constants'
import {
	fetchCurrentUserApiUsersCurrentGetOptions,
	getUsersApiUsersGetOptions,
	loginApiLoginPostMutation
} from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import { logoutApiLogoutPost } from '$lib/heyapi/eventlab/sdk.gen'
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

	async logout() {
		try {
			await logoutApiLogoutPost({
				baseUrl: EventlabBaseUrl,
				auth: defaultAuth,
				credentials: 'include'
			})
		} catch {
			// ignore network/401 errors - we still clear local state
		} finally {
			if (typeof localStorage !== 'undefined') {
				localStorage.removeItem('auth_token')
			}
			this.accessToken = null

			// Clear cached user query so `myUser` derived becomes null immediately
			// (`enabled: false` alone would keep stale success data)
			const key = fetchCurrentUserApiUsersCurrentGetOptions({
				baseUrl: EventlabBaseUrl,
				auth: defaultAuth,
				credentials: 'include'
			}).queryKey

			queryClient.removeQueries({ queryKey: key })
		}
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
