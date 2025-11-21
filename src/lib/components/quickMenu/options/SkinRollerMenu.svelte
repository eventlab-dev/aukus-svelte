<script lang="ts">
	import SkinsRoller, { type WeightedOption } from '$lib/components/roller/SkinsRoller.svelte'
	import { Button } from '$lib/components/ui/button'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { usersStore } = getAppManagerContext()
	const { unlockableSkins, unlockSkinQuery } = usersStore

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
	}
</script>

<Button onclick={handleClick}>Ролл скинов</Button>

<SkinsRoller
	autoOpen={isOpen}
	onClose={handleClose}
	options={rollOptions}
	header="Скин за прохождение игры"
	onRollFinish={handleRollFinish}
	getWinnerText={() => ''}
/>
