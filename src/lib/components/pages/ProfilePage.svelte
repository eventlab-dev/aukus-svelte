<script lang="ts">
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { Button } from '$lib/components/ui/button'
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
	import SkinEditor from '$lib/components/skinEditor/SkinEditor.svelte'
	import ShitMenu from '$lib/components/quickMenu/options/shitMenu/ShitMenu.svelte'

	const app = getAppManager()
	const { navStore } = app

	const myPlayer = $derived(app.myPlayer)
	const myUser = $derived(app.myUser)
	const integrationsStore = $derived(app.integrationsStore)
	const integrations = $derived(integrationsStore.integrations?.integrations ?? [])
	const startAuthQuery = $derived(integrationsStore.startAuthQuery)

	const VALID_TABS = ['skins', 'shit', 'integrations']

	const activeTab = $derived(
		navStore.appPage === 'profile' && navStore.subpage && VALID_TABS.includes(navStore.subpage)
			? navStore.subpage
			: 'skins'
	)

	function onTabChange(next: string) {
		if (next === 'skins') {
			navStore.navigate('/profile')
		} else {
			navStore.navigate(`/profile/${next}`)
		}
	}

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

	async function handleLogout() {
		await app.usersStore.logout()
		navStore.navigate('/')
	}
</script>

<div class="flex justify-center">
	<div class="mt-[100px] w-[700px]">
		{#if myPlayer}
			<div class="mb-8 flex items-center justify-center gap-2 font-extrabold">
				<div class="mr-2 text-5xl font-bold">Профиль</div>
				<PlayerAvatar
					src={myPlayer.avatar_link ?? ''}
					name={myPlayer.username}
					isOnline={Boolean(myPlayer.is_online)}
				/>
				<div class="text-4xl">{myPlayer.username}</div>
			</div>

			<Tabs value={activeTab} onValueChange={(v) => onTabChange(v)} class="w-full">
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
								<div class="rounded-lg border bg-card p-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3">
											<div class="text-lg font-semibold">
												{integration.display_name}
											</div>
											{#if integration.is_active || true}
												<div
													class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300"
												>
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
									<div>{integration.description}</div>
								</div>
							{/each}
						{/if}
						<div class="mt-6 flex justify-center">
							<Button variant="destructive" onclick={handleLogout}>Выйти</Button>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		{:else if myUser}
			<div class="mb-8 text-5xl font-bold">Профиль пользователя</div>
			<div class="text-2xl">
				<div class="mb-4">Имя пользователя: <span class="font-bold">{myUser.username}</span></div>
				<div>Игровой профиль не найден</div>
			</div>
			<div class="mt-6 flex justify-center">
				<Button variant="destructive" onclick={handleLogout}>Выйти</Button>
			</div>
		{:else}
			<div class="mb-8 text-5xl font-bold">Профиль</div>
			<div class="text-2xl text-gray-400">
				Сначала авторизируйся, чтобы просмотреть свой профиль
			</div>
			<Button class="mt-4" onclick={() => app.navStore.navigate('/login')}>Войти</Button>
		{/if}
	</div>
</div>
