<script lang="ts">
	import FireIcon from '$lib/components/icons/new/FireIcon.svelte'
	import ShieldIcon from '$lib/components/icons/new/ShieldIcon.svelte'
	import AddShitDialog from './AddShitDialog.svelte'
	import MakeShieldDialog from './MakeShieldDialog.svelte'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs'
	import PlayerAvatar from '$lib/components/player/PlayerAvatar.svelte'
	import { Button } from '$lib/components/ui/button'

	const app = getAppManager()
	const { shitStore, eventDataStore } = app

	let selectedPlayerSlug = $state('')
	let kickCompleted = $state(false)

	const otherPlayers = $derived(app.players.filter((p) => p.slug !== app.myPlayer?.slug))
	const selectedPlayer = $derived(otherPlayers.find((p) => p.slug === selectedPlayerSlug))

	$effect(() => {
		if (selectedPlayerSlug) {
			kickCompleted = false
		}
	})

	async function kickPlayer() {
		if (!selectedPlayerSlug) return
		
		await shitStore.kickPlayerQuery.mutateAsync({
			body: {
				target_player_slug: selectedPlayerSlug
			}
		})
		eventDataStore.eventDataQuery.refetch()
		kickCompleted = true
		selectedPlayerSlug = ''
	}
</script>

<div class="mt-10">
	<div class="flex gap-20 font-extrabold">
		<div class="flex items-center gap-2">
			<div class="relative">
				<div
					class="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-1 uppercase"
				>
					<FireIcon /> Подсёры
				</div>
				<div class="w-[160px] rounded-[22px] bg-secondary p-2 text-center text-4xl font-bold">
					{app.myPlayer?.shit_stacks}
				</div>
			</div>
			<AddShitDialog />
		</div>
		<div class="flex items-center gap-2">
			<div class="relative">
				<div
					class="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-1 uppercase"
				>
					<ShieldIcon /> Щиты
				</div>
				<div class="w-[160px] rounded-[22px] bg-secondary p-2 text-center text-4xl font-bold">
					{app.myPlayer?.shield_stacks}
				</div>
			</div>
			<MakeShieldDialog />
		</div>
	</div>

	<div class="mt-10 w-full border-dashed-bottom"></div>

	<div class="mt-10">
		<div class="text-center text-2xl font-extrabold uppercase">Кинуть подсер в:</div>
		{#if otherPlayers.length > 0}
			<Tabs bind:value={selectedPlayerSlug} class="mt-4">
				<TabsList class="flex flex-wrap justify-center gap-2 bg-transparent w-full">
					{#each otherPlayers as player (player.slug)}
						<TabsTrigger value={player.slug} class="flex items-center gap-2">
							<PlayerAvatar
								src={player.avatar_link ?? ''}
								name={player.username}
								isOnline={Boolean(player.is_online)}
								size="small"
							/>
							<span class="uppercase">{player.username}</span>
						</TabsTrigger>
					{/each}
				</TabsList>
			</Tabs>
		{/if}
		<div class="flex justify-center w-full mt-8">
			<Button 
				class="uppercase" 
				disabled={!selectedPlayer || kickCompleted}
				onclick={kickPlayer}
				loading={shitStore.kickPlayerQuery.isPending}
			>
				{#if kickCompleted}
					Готово!
				{:else if selectedPlayer}
					Кинуть в — 
					<PlayerAvatar
						src={selectedPlayer.avatar_link ?? ''}
						name={selectedPlayer.username}
						isOnline={Boolean(selectedPlayer.is_online)}
						size="small"
					/>
							<span>{selectedPlayer.username}</span>
				{:else}
					Выбери игрока
				{/if}
			</Button>
		</div>
	</div>
</div>
