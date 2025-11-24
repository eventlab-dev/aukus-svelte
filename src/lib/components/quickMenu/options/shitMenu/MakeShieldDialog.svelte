<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '$lib/components/ui/dialog'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { shitStore, eventDataStore, myPlayer } = getAppManagerContext()
	const { makeShield } = shitStore
	const { eventDataQuery } = eventDataStore

	let open = $state(false)

	async function onclick() {
		await $makeShield.mutateAsync({})
		open = false
		$eventDataQuery.refetch()
	}
</script>

<Dialog {open} onOpenChange={(state) => (open = state)}>
	<DialogTrigger class="w-full">
		<Button class="w-full">Сделать щит</Button>
	</DialogTrigger>
	{#if $myPlayer && $myPlayer?.shit_stacks >= 10}
		<DialogContent>
			<DialogHeader class="text-3xl">Поменять 10 стаков на 3 стак щита?</DialogHeader>
			<div class="mt-10 flex justify-center">
				<Button class="w-100" {onclick} loading={$makeShield.isPending}>Да</Button>
			</div>
		</DialogContent>
	{:else}
		<DialogContent>
			<DialogHeader class="text-3xl">Не хватает стаков: {$myPlayer?.shit_stacks}/10</DialogHeader>
			<div class="mt-10 flex justify-center">
				<Button class="w-100" onclick={() => (open = false)}>Согласен</Button>
			</div>
		</DialogContent>
	{/if}
</Dialog>
