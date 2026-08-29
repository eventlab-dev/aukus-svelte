<script lang="ts">
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import TwitchIcon from './icons/TwitchIcon.svelte'
	import KickIcon from './icons/KickIcon.svelte'
	import { Button } from './ui/button'

	const app = getAppManager()
	const { integrationsStore } = app

	let pendingProvider = $state<string | null>(null)

	async function loginWithProvider(provider: string) {
		try {
			pendingProvider = provider
			const result = await integrationsStore.startAuth(provider, 'aukus5')
			if (result.authorization_url) {
				window.location.href = result.authorization_url
			}
		} catch (error) {
			console.error('Failed to start OAuth login:', error)
		} finally {
			pendingProvider = null
		}
	}
</script>

<div class="flex w-full flex-col gap-5 rounded-xl bg-card p-3">
	<div class="mx-auto w-fit space-y-2">
		<div class="text-xl leading-6 font-bold">Войти в аккаунт</div>
	</div>
	<div class="flex flex-col gap-3">
		<Button
			class="w-full rounded-xl bg-[#9146FF] text-white hover:bg-[#9146FF]/80"
			disabled={pendingProvider !== null}
			loading={pendingProvider === 'twitch'}
			onclick={() => loginWithProvider('twitch')}
		>
			<TwitchIcon />
			Войти через Twitch
		</Button>
		<Button
			class="w-full rounded-xl bg-[#53fc18] text-black hover:bg-[#53fc18]/80"
			disabled={pendingProvider !== null}
			loading={pendingProvider === 'kick'}
			onclick={() => loginWithProvider('kick')}
		>
			<KickIcon />
			Войти через Kick
		</Button>
	</div>
</div>
