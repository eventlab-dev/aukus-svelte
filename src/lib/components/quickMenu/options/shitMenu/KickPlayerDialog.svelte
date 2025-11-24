<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '$lib/components/ui/dialog'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { PlayerData } from '$lib/types'

	type Props = {
		player: PlayerData
	}

	const { player }: Props = $props()

	const { shitStore, eventDataStore, myPlayer } = getAppManagerContext()
	const { kickPlayer } = shitStore
	const { eventDataQuery } = eventDataStore

	let open = $state(false)

	async function onclick() {
		await $kickPlayer.mutateAsync({
			body: {
				target_player_slug: player.slug
			}
		})
		$eventDataQuery.refetch()
		open = false
	}
</script>

{#if $myPlayer}
	<Dialog {open} onOpenChange={(state) => (open = state)}>
		<DialogTrigger class="w-fit">
			<Button loading={$kickPlayer.isPending}>Подосрать</Button>
		</DialogTrigger>
		<DialogContent>
			<DialogHeader class="text-3xl">
				Потратить 1 стак из {$myPlayer.shit_stacks} чтобы закинуть игру?
			</DialogHeader>
			<div class="mt-10 flex justify-center">
				<Button
					class="w-100"
					{onclick}
					loading={$kickPlayer.isPending}
					disabled={$myPlayer.shit_stacks < 1}>Подосрать</Button
				>
			</div>
		</DialogContent>
	</Dialog>
{/if}
