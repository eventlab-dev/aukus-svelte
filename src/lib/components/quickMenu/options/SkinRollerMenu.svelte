<script lang="ts">
	import SkinsRoller, { type WeightedOption } from '$lib/components/roller/SkinsRoller.svelte'
	import { Button } from '$lib/components/ui/button'
	import { Dialog, DialogContent } from '$lib/components/ui/dialog'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { getConfirmationText } from '$lib/utils'
	import Gift from '@lucide/svelte/icons/gift'

	const { usersStore, myPlayer, eventDataStore } = getAppManagerContext()
	const { unlockableSkins, unlockableSkinsQuery, unlockSkinQuery } = usersStore
	const { eventDataQuery } = eventDataStore

	const rollOptions: WeightedOption[] = $derived(
		$unlockableSkins.map((s) => ({
			label: '',
			weight: 1,
			value: s.id.toString(),
			imageUrl: s.image_url
		}))
	)

	let isOpen = $state(false)

	function handleClick() {
		isOpen = true
	}

	let finishText = $state(getConfirmationText())

	function handleClose() {
		isOpen = false
		$eventDataQuery.refetch()
		$unlockableSkinsQuery.refetch()
		finishText = getConfirmationText()
	}

	async function handleRollFinish(winner: WeightedOption) {
		await $unlockSkinQuery.mutateAsync({
			body: {
				skin_id: Number(winner.value)
			}
		})
	}
</script>

{#if $myPlayer}
	<Button onclick={handleClick}>
		<Gift />
		Ролл скинов ({$myPlayer.skin_rolls})
	</Button>

	{#if $myPlayer.skin_rolls === 0}
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent>
				<div class="p-6 text-3xl">Проходи игры чтобы получить роллы скинов!</div>
				<div class="flex justify-center">
					<Button class="w-100" onclick={() => (isOpen = false)}>Согласен</Button>
				</div>
			</DialogContent>
		</Dialog>
	{:else}
		<SkinsRoller
			autoOpen={isOpen}
			onClose={handleClose}
			options={rollOptions}
			header="Скин за прохождение игры"
			onRollFinish={handleRollFinish}
			getWinnerText={() => ''}
			finishButtonText={finishText}
		/>
	{/if}
{/if}
