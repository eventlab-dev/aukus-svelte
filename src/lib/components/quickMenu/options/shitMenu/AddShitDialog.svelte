<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '$lib/components/ui/dialog'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { shitStore, eventDataStore } = getAppManagerContext()

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
		<Button class="w-full bg-secondary">+1</Button>
	</DialogTrigger>
	<DialogContent>
		<DialogHeader class="text-3xl">Получить стак подсёра за донатгол в 5000₽?</DialogHeader>
		<div class="mt-10 flex justify-center">
			<Button class="w-100" {onclick} loading={shitStore.addShitQuery.isPending}>Да</Button>
		</div>
	</DialogContent>
</Dialog>
