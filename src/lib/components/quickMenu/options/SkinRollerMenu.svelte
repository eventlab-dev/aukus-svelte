<script lang="ts">
	import SkinsRoller, { type WeightedOption } from '$lib/components/roller/SkinsRoller.svelte'
	import SkinPreview from '$lib/components/skinEditor/SkinPreview.svelte'
	import { Button } from '$lib/components/ui/button'
	import { Dialog, DialogContent } from '$lib/components/ui/dialog'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { type SkinItem } from '$lib/heyapi/aukus/types.gen'
	import { getConfirmationText } from '$lib/utils'
	import Gift from '@lucide/svelte/icons/gift'

	const { usersStore, myPlayer, eventDataStore } = getAppManagerContext()
	const { unlockableSkins, unlockableSkinsQuery, unlockSkinQuery } = usersStore
	const { eventDataQuery } = eventDataStore

	const rollOptions: WeightedOption<SkinItem>[] = $derived(
		$unlockableSkins.map((s) => ({
			label: '',
			weight: 1,
			value: s.id.toString(),
			item: s
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

	async function handleRollFinish(winner: WeightedOption<SkinItem>) {
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
				<div class="p-2 text-3xl">Проходи игры чтобы получить роллы скинов!</div>
				<div class="flex flex-col gap-2 p-2">
					<div>Игры 0-11ч: 1 ролл</div>
					<div>Игры 12-24ч: 2 ролла</div>
					<div>Игры 25ч и больше: 3 ролла</div>
				</div>
				<div class="flex justify-center">
					<Button class="w-100" onclick={() => (isOpen = false)}>Согласен</Button>
				</div>
			</DialogContent>
		</Dialog>
	{:else if rollOptions.length === 0}
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent>
				<div class="p-2 text-3xl">Похоже ты собрал все скины!</div>
				<div class="flex justify-center">
					<Button class="w-100" onclick={() => (isOpen = false)}>Круто!</Button>
				</div>
			</DialogContent>
		</Dialog>
	{:else}
		{#snippet skinImage(skin: SkinItem)}
			<SkinPreview {skin} />
		{/snippet}
		<SkinsRoller
			autoOpen={isOpen}
			onClose={handleClose}
			options={rollOptions}
			header="Скин за прохождение игры"
			onRollFinish={handleRollFinish}
			getWinnerText={() => ''}
			finishButtonText={finishText}
			itemRenderer={skinImage}
		/>
	{/if}
{/if}
