<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '$lib/components/ui/dialog'
	
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
	const { shitStore, eventDataStore } = app

	let open = $state(false)

	async function onclick() {
		await shitStore.addShitQuery.mutateAsync({
			body: {
				amount: 1
			}
		})
		open = false
		eventDataStore.eventDataQuery.refetch()
	}
</script>

<Dialog {open} onOpenChange={(state) => (open = state)}>
	<DialogTrigger class="w-full">
		<Button class="w-full bg-secondary rounded-[18px]">+1</Button>
	</DialogTrigger>
	<DialogContent>
		<DialogHeader class="text-3xl">Получить стак подсёра за донатгол в 5000₽?</DialogHeader>
		<div class="mt-10 flex justify-center">
			<Button class="w-100 bg-secondary" {onclick} loading={shitStore.addShitQuery.isPending}>Да</Button>
		</div>
	</DialogContent>
</Dialog>
