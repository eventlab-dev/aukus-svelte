<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '$lib/components/ui/dialog'
	import type { PlayerKickResult } from '$lib/heyapi/aukus/types.gen'

	import { getAppManager } from '$lib/stores/AppManager.svelte'
	import type { Snippet } from 'svelte'

	type Props = {
		children: Snippet
	}

	let { children }: Props = $props()

	const app = getAppManager()
	const { shitStore, eventDataStore } = app

	let open = $state(false)

	async function addShit() {
		await shitStore.addShitQuery.mutateAsync({
			body: {
				amount: 1
			}
		})
		eventDataStore.eventDataQuery.refetch()
	}

	async function addShield() {
		await shitStore.makeShieldQuery.mutateAsync({})
		eventDataStore.eventDataQuery.refetch()
	}

	let kickedPlayerSlug = $state<string | null>(null)
	let kickResult = $state<PlayerKickResult | null>(null)

	let showKickSection = $state(false)

	function openKickSection() {
		kickedPlayerSlug = null
		kickResult = null
		showKickSection = true
	}

	async function kickPlayer(slug: string) {
		kickedPlayerSlug = null
		kickResult = null
		const result = await shitStore.kickPlayerQuery.mutateAsync({
			body: {
				target_player_slug: slug
			}
		})
		kickResult = result.result_type
		kickedPlayerSlug = slug
		eventDataStore.eventDataQuery.refetch()
	}

	const shitStacks = $derived(app.myPlayer?.shit_stacks ?? 0)
	const shieldStacks = $derived(app.myPlayer?.shield_stacks ?? 0)
</script>

<Dialog {open} onOpenChange={(state) => (open = state)}>
	<DialogTrigger class="w-full">
		{@render children?.()}
	</DialogTrigger>
	<DialogContent>
		<DialogHeader class="text-2xl">Подсеры</DialogHeader>

		<div>Доступно подсеров: {shitStacks}</div>
		<div>Доступно щитов: {shieldStacks}</div>

		<Button onclick={addShit} loading={shitStore.addShitQuery.isPending}>
			Получить подсёр за донатгол в 5000₽
		</Button>
		<Button
			onclick={addShield}
			loading={shitStore.makeShieldQuery.isPending}
			disabled={shitStacks < 10}
		>
			Конвертировать 10 подсеров в 1 щит
		</Button>
		<Button
			onclick={openKickSection}
			loading={shitStore.kickPlayerQuery.isPending}
			disabled={shitStacks < 1}
		>
			Кинуть подсер в игрока
		</Button>
		{#if showKickSection}
			<div class="flex flex-col items-center justify-center gap-4">
				{#if kickResult === null}
					<div>В кого кинуть?</div>
					<div class="flex flex-wrap gap-4">
						{#each app.players as player (player.slug)}
							{#if player.slug !== app.myPlayer?.slug}
								<Button onclick={() => kickPlayer(player.slug)}>{player.username}</Button>
							{/if}
						{/each}
					</div>
				{:else if kickResult === 'win'}
					<div>
						Подсер успешно кинут в {app.players.find((p) => p.slug === kickedPlayerSlug)?.username}
					</div>
				{:else if kickResult === 'shield_removed'}
					<div>
						Подсер не кинут! У игрока {app.players.find((p) => p.slug === kickedPlayerSlug)
							?.username}
						был убран щит
					</div>
				{:else if kickResult === 'out_of_shit'}
					<div>Недостаточно подсеров!</div>
				{/if}
			</div>
		{/if}
	</DialogContent>
</Dialog>
