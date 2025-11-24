<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '$lib/components/ui/dialog'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { type PlayerKickResult } from '$lib/heyapi/aukus/types.gen'
	import type { PlayerData } from '$lib/types'

	type Props = {
		player: PlayerData
	}

	const { player }: Props = $props()

	const { shitStore, eventDataStore, myPlayer } = getAppManagerContext()
	const { kickPlayer } = shitStore
	const { eventDataQuery } = eventDataStore

	let open = $state(false)

	let outcome = $state<PlayerKickResult | null>(null)

	async function onclick() {
		const result = await $kickPlayer.mutateAsync({
			body: {
				target_player_slug: player.slug
			}
		})
		outcome = result.result_type
		$eventDataQuery.refetch()
	}

	function onOpenChange(state: boolean) {
		open = state
		if (!state) {
			outcome = null
		}
	}
</script>

{#if $myPlayer}
	<Dialog {open} {onOpenChange}>
		<DialogTrigger class="w-fit">
			<Button loading={$kickPlayer.isPending}>Подосрать</Button>
		</DialogTrigger>
		<DialogContent>
			<DialogHeader class="text-3xl">
				Потратить 1/{$myPlayer.shit_stacks} чтобы закинуть 5000 на игру для {player.username}?
			</DialogHeader>
			{#if outcome === 'shield_removed'}
				<div class="mt-10 flex justify-center text-lg">
					{player.username} защитился и потерял стак щита!
				</div>
			{:else if outcome === 'win'}
				<div class="mt-10 flex justify-center text-lg">Получилось, можно закидывать!</div>
			{:else if outcome === 'out_of_shit'}
				<div class="mt-10 flex justify-center text-lg">Упс стаков нехватает!</div>
			{:else}
				<div class="mt-10 flex justify-center">
					<Button
						class="w-100"
						{onclick}
						loading={$kickPlayer.isPending}
						disabled={$myPlayer.shit_stacks < 1}>Подосрать</Button
					>
				</div>
			{/if}
		</DialogContent>
	</Dialog>
{/if}
