<script lang="ts">
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import Spinner from '$lib/components/Spinner.svelte'
	import { Button } from '$lib/components/ui/button'

	const app = getAppManager()

	const provider = $derived(page.url.searchParams.get('provider') ?? '')
	const myUser = $derived(app.myUser)
	const myUserQuery = app.usersStore.myUserQuery

	let status = $state<'loading' | 'success' | 'error'>('loading')

	$effect(() => {
		if (myUserQuery.isLoading || myUserQuery.isPending) {
			return
		}

		if (myUser) {
			status = 'success'
			goto('/profile/integrations', { replaceState: true })
		} else {
			status = 'error'
		}
	})
</script>

<svelte:head>
	<title>Завершение авторизации</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-4">
	{#if status === 'loading'}
		<Spinner size={32} />
		<div class="text-lg font-semibold">
			{provider ? `Завершаем подключение ${provider}...` : 'Завершаем авторизацию...'}
		</div>
	{:else if status === 'error'}
		<div class="text-center text-lg font-semibold text-red-500">
			Не удалось завершить интеграцию с {provider}
		</div>
		<Button onclick={() => goto('/')}>Назад</Button>
	{/if}
</div>
