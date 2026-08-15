<script lang="ts">
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { Button } from '$lib/components/ui/button'
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
	import SkinEditor from '$lib/components/skinEditor/SkinEditor.svelte'
	import ShitMenu from '$lib/components/quickMenu/options/shitMenu/ShitMenu.svelte'

	const app = getAppManager()

	const myPlayer = $derived(app.myPlayer)
	const myUser = $derived(app.myUser)
	const integrationsStore = $derived(app.integrationsStore)
	const integrations = $derived(integrationsStore.integrations?.integrations ?? [])
	const startAuthQuery = $derived(integrationsStore.startAuthQuery)

	let activeTab = $state('skins')

	async function startIntegration(providerName: string) {
		try {
			const result = await integrationsStore.startAuth(providerName, 'eventlab')
			if (result.authorization_url) {
				window.location.href = result.authorization_url
			}
		} catch (error) {
			console.error('Failed to start integration:', error)
		}
	}
</script>

<div class="flex justify-center">
	<div class="mt-[100px] w-[700px]">
		{#if myPlayer}
			<div class="flex gap-2 font-extrabold items-center justify-center mb-8">
				<div class="text-5xl font-bold mr-2">Профиль</div>
				<PlayerAvatar
					src={myPlayer.avatar_link ?? ''}
					name={myPlayer.username}
					isOnline={Boolean(myPlayer.is_online)}
				/>
				<div class="text-4xl">{myPlayer.username}</div>
			</div>

			<Tabs bind:value={activeTab} class="w-full">
				<TabsList class="mb-6 flex w-full justify-center gap-2 bg-transparent">
					<TabsTrigger value="skins">Персонаж</TabsTrigger>
					<TabsTrigger value="shit">Подсеры</TabsTrigger>
					<TabsTrigger value="integrations">Интеграции</TabsTrigger>
				</TabsList>
				
				<TabsContent value="skins">
					<SkinEditor />
				</TabsContent>
				
				<TabsContent value="shit">
					<div class="flex flex-col items-center gap-4">
						<ShitMenu />
					</div>
				</TabsContent>
				
				<TabsContent value="integrations">
					<div class="flex flex-col gap-4">
						{#if integrations.length === 0}
							<div class="text-center text-gray-400">
								<p>Нет доступных интеграций</p>
							</div>
						{:else}
							{#each integrations as integration (integration.provider_name)}
								<div class="flex items-center justify-between p-4 border rounded-lg bg-card dark:bg-gray-800">
									<div class="flex items-center gap-3">
										<div class="text-lg font-semibold">
											{integration.display_name}
										</div>
										{#if integration.is_active || true}
											<div class="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">
												Активно
											</div>
										{/if}
									</div>
										<Button
										    class="bg-secondary"
											onclick={() => startIntegration(integration.provider_name)}
											disabled={startAuthQuery.isPending}
										>
											{startAuthQuery.isPending ? 'Загрузка...' : 'Подключить'}
										</Button>
								</div>
							{/each}
						{/if}
					</div>
				</TabsContent>
			</Tabs>
		{:else if myUser}
			<div class="text-5xl font-bold mb-8">Профиль пользователя</div>
			<div class="text-2xl">
				<div class="mb-4">Имя пользователя: <span class="font-bold">{myUser.username}</span></div>
				<div class="text-gray-400">Игровой профиль не найден</div>
			</div>
		{:else}
			<div class="text-5xl font-bold mb-8">Профиль</div>
			<div class="text-2xl text-gray-400">
				Сначала авторизуйтесь, чтобы просмотреть свой профиль
			</div>
			<Button
				class="mt-4"
				onclick={() => app.navStore.navigate('/login')}
			>
				Войти
			</Button>
		{/if}
	</div>
</div>
