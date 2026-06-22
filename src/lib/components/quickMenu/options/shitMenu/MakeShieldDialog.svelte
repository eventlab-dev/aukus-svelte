<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '$lib/components/ui/dialog'
	import { getAppManager } from '$lib/stores/AppManager.svelte'
	
	const app = getAppManager()
	const { shitStore, eventDataStore } = app

	let open = $state(false)

	async function onclick() {
		await shitStore.makeShieldQuery.mutateAsync({})
		open = false
		eventDataStore.eventDataQuery.refetch()
	}
</script>

<Dialog {open} onOpenChange={(state) => (open = state)}>
	<DialogTrigger class="w-full">
		<Button class="w-full bg-secondary">Сделать щит</Button>
	</DialogTrigger>
	{#if app.myPlayer}
		{#if app.myPlayer.shield_stacks >= 9}
			<DialogContent>
				<DialogHeader class="text-3xl">Максимум щитов достигнут!</DialogHeader>
				<div class="mt-10 flex justify-center">
					<Button class="w-100" onclick={() => (open = false)}>Согласен</Button>
				</div>
			</DialogContent>
		{:else if app.myPlayer?.shit_stacks >= 10}
			<DialogContent>
				<DialogHeader class="text-3xl">Поменять 10 стаков на 3 стак щита?</DialogHeader>
				<div class="mt-10 flex justify-center">
					<Button class="w-100" {onclick} loading={shitStore.makeShieldQuery.isPending}>Да</Button>
				</div>
			</DialogContent>
		{:else}
			<DialogContent>
				<DialogHeader class="w-full text-center text-3xl">
					<div class="w-full text-center">Не хватает стаков: {app.myPlayer?.shit_stacks}/10</div>
				</DialogHeader>
				<div class="mt-10 flex justify-center">
					<Button class="w-100" onclick={() => (open = false)}>Согласен</Button>
				</div>
			</DialogContent>
		{/if}
	{/if}
</Dialog>
