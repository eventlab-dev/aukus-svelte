<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import Profile2Icon from './icons/Profile2Icon.svelte'
	import TwitchIcon from './icons/TwitchIcon.svelte'
	import { Button } from './ui/button'
	import { Input } from './ui/input'

	const { usersStore } = getAppManagerContext()
	const { myUserQuery } = usersStore

	let name = $state('')
	let password = $state('')

	const isValid = $derived(!!name && !!password)

	function login() {
		usersStore.login(name, password)
	}
</script>

<div class="w-[390px] space-y-[50px] rounded-xl bg-card p-3">
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
		/>
		<Input
			id="password"
			type="password"
			placeholder="Пароль"
			class="rounded-t-[4px] bg-muted"
			bind:value={password}
			onkeypress={(e) => e.key === 'Enter' && isValid && login()}
		/>
	</div>
	<div class="flex flex-col items-center justify-center gap-1.5">
		<Button
			class="w-full rounded-b-[4px]"
			disabled={!isValid}
			onclick={login}
			loading={$myUserQuery.isLoading}>Войти</Button
		>
		<Button
			class="w-full rounded-t-[4px] bg-[#9146FF] hover:bg-[#9146FF]/80"
			onclick={login}
			loading={$myUserQuery.isLoading}
		>
			<TwitchIcon />
			Войти через Twitch
		</Button>
	</div>
</div>
