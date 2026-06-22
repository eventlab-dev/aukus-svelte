<script lang="ts">
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import Profile2Icon from './icons/Profile2Icon.svelte'
	import TwitchIcon from './icons/TwitchIcon.svelte'
	import { Button } from './ui/button'
	import { Input } from './ui/input'

	const app = getAppManager()
	const { usersStore, navStore } = app

	let name = $state('')
	let password = $state('')

	const isValid = $derived(!!name && !!password)

	async function login() {
		const success = await usersStore.login(name, password)
		if (success) {
			navStore.closePage()
		}
	}

	function clearError() {
		usersStore.loginError = null
	}
</script>

<div class="flex w-full flex-col gap-5 rounded-xl bg-card p-3">
	<div class="mx-auto w-fit space-y-2">
		<Profile2Icon class="mx-auto" />
		<div class="text-xl leading-6 font-bold">Войти в аккаунт</div>
	</div>
	<div class="space-y-1.5">
		<Input
			id="name"
			type="text"
			autocomplete="name"
			placeholder="Имя"
			class="rounded-b-[4px] bg-muted"
			bind:value={name}
			onkeypress={(e) => e.key === 'Enter' && isValid && login()}
			oninput={clearError}
		/>
		<Input
			id="password"
			type="password"
			placeholder="Пароль"
			class="rounded-t-[4px] bg-muted"
			bind:value={password}
			onkeypress={(e) => e.key === 'Enter' && isValid && login()}
			oninput={clearError}
		/>
		{#if usersStore.loginError}
			<div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
				{usersStore.loginError}
			</div>
		{/if}
	</div>
	<div class="flex flex-col items-center justify-center gap-1.5">
		<Button
			class="w-full rounded-xl"
			disabled={!isValid}
			onclick={login}
			loading={usersStore.loginMutation.isPending}>Войти</Button
		>
		<Button
			class="hidden w-full rounded-t-[4px] bg-[#9146FF] hover:bg-[#9146FF]/80"
			onclick={login}
			loading={usersStore.loginMutation.isPending}
		>
			<TwitchIcon />
			Войти через Twitch
		</Button>
	</div>
</div>
