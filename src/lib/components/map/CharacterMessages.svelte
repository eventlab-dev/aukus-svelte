<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { NPCList } from '$lib/mapUtils'
	import NPCComponent from './NPCComponent.svelte'

	const MESSAGE_DURATION = 5000
	const START_DELAY = 1000
	const BETWEEN_DELAY = 5000

	const { eventDataStore } = getAppManagerContext()
	const { chatMessages } = eventDataStore

	let displayMessageId = $state(-1)

	$effect(() => {
		// depend on messages array changes
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		$chatMessages[0]?.id

		const timeout = setTimeout(() => {
			if ($chatMessages.length > 0) {
				displayMessageId = 0
			}
		}, START_DELAY)
		return () => clearTimeout(timeout)
	})

	async function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	$effect(() => {
		if (displayMessageId === -1) return

		const timeout = setTimeout(() => {
			const nextId = displayMessageId + 1
			displayMessageId = -1
			sleep(BETWEEN_DELAY).then(() => {
				if ($chatMessages.length > nextId) {
					displayMessageId = nextId
				} else {
					displayMessageId = -1
				}
			})
		}, MESSAGE_DURATION)
		return () => clearTimeout(timeout)
	})

	const message = $derived($chatMessages[displayMessageId])

	const messageNpc = $derived.by(() => {
		if (message) {
			const id = message.created_at % NPCList.length
			return NPCList[id]
		}
		return null
	})
</script>

{#each NPCList as npc (npc.imageUrl)}
	<NPCComponent {npc} message={messageNpc?.imageUrl === npc.imageUrl ? message.text : undefined} />
{/each}
