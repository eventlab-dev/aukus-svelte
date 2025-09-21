<script lang="ts">
	import { EventlabBaseUrl } from '$lib/client'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { fetchCurrentUserApiUsersCurrentGetOptions } from '$lib/heyapi/@tanstack/svelte-query.gen'
	import { createQuery } from '@tanstack/svelte-query'

	const { usersStore } = getAppManagerContext()

	const fetchCurrentUser = createQuery({
		...fetchCurrentUserApiUsersCurrentGetOptions({
			baseUrl: EventlabBaseUrl,
			auth: () => localStorage.getItem('auth_token') ?? undefined
		}),
		retry: false,
		structuralSharing: false
	})

	$effect(() => {
		usersStore.setMyUser($fetchCurrentUser.data ?? null)
	})
</script>
