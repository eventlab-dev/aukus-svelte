<script lang="ts">
	import SkinsRoller, { type WeightedOption } from '$lib/components/roller/SkinsRoller.svelte'
	import { Button } from '$lib/components/ui/button'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

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

	function handleClose() {
		isOpen = false
	}

	async function handleRollFinish(winner: WeightedOption) {
		await $unlockSkinQuery.mutateAsync({
			body: {
				skin_id: Number(winner.value)
			}
		})
		$eventDataQuery.refetch()
		$unlockableSkinsQuery.refetch()
	}
</script>

{#if $myPlayer}
	<Button onclick={handleClick} disabled={$myPlayer.skin_rolls <= 0}
		>Ролл скинов ({$myPlayer.skin_rolls})</Button
	>

	<SkinsRoller
		autoOpen={isOpen}
		onClose={handleClose}
		options={rollOptions}
		header="Скин за прохождение игры"
		onRollFinish={handleRollFinish}
		getWinnerText={() => ''}
	/>
{/if}
