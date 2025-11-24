<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '$lib/components/ui/dialog'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { shitStore, eventDataStore } = getAppManagerContext()
	const { addShit } = shitStore
	const { eventDataQuery } = eventDataStore

	let open = $state(false)

	async function onclick() {
		await $addShit.mutateAsync({
			body: {
				amount: 1
			}
		})
		open = false
		$eventDataQuery.refetch()
	}
</script>

<Dialog {open} onOpenChange={(state) => (open = state)}>
	<DialogTrigger class="w-full">
		<Button class="w-full bg-secondary">+1</Button>
	</DialogTrigger>
	<DialogContent>
		<DialogHeader class="text-3xl">Добавить стак подсера за донатгол в 5000?</DialogHeader>
		<div class="mt-10 flex justify-center">
			<Button class="w-100" {onclick} loading={$addShit.isPending}>Да</Button>
		</div>
	</DialogContent>
</Dialog>
