<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { ChatMessageItem } from '$lib/heyapi/aukus/types.gen'
	import { NPCList } from '$lib/mapUtils'
	import NPCComponent from './NPCComponent.svelte'

	type TimedMessage = {
		msg: ChatMessageItem
		displayTime: number
	}

	const MESSAGE_DISPLAY_MIN = 6000
	const MESSAGE_DISPLAY_MAX = 10000
	const START_DELAY = 1000
	const BETWEEN_DELAY_MIN = 3000
	const BETWEEN_DELAY_MAX = 6000

	function getDisplayTime() {
		return Math.random() * (MESSAGE_DISPLAY_MAX - MESSAGE_DISPLAY_MIN) + MESSAGE_DISPLAY_MIN
	}

	function getBetweenTime() {
		return Math.random() * (BETWEEN_DELAY_MAX - BETWEEN_DELAY_MIN) + BETWEEN_DELAY_MIN
	}

	const charactarsThatCanSpeak = NPCList.filter((npc) => !npc.cantSpeak)

	const { eventDataStore } = getAppManagerContext()
	const { chatMessages } = eventDataStore

	const queue1 = $derived(
		$chatMessages
			.filter((_, index) => index % 2 === 0)
			.map((msg) => ({
				msg,
				displayTime: getDisplayTime()
			}))
	)
	const queue2 = $derived(
		$chatMessages
			.filter((_, index) => index % 2 === 1)
			.map((msg) => ({
				msg,
				displayTime: getDisplayTime()
			}))
	)

	let queue1Id = $state(-1)
	let queue2Id = $state(-1)

	let tokens: { cancelled: boolean }[] = []

	async function startDisplay(
		queue: TimedMessage[],
		idSetter: (id: number) => void,
		delay: number
	) {
		let currentId = -1

		const cancelToken = { cancelled: false }
		tokens.push(cancelToken)

		async function wait(ms: number) {
			return new Promise((resolve) => setTimeout(resolve, ms))
		}

		async function displayNext() {
			if (cancelToken.cancelled) return

			currentId++
			const nextMsg = queue[currentId]
			if (!nextMsg) {
				idSetter(-1)
				return
			}

			idSetter(currentId)
			await wait(nextMsg.displayTime)
			idSetter(-1)
			await wait(getBetweenTime())
			displayNext()
		}

		await wait(delay)
		displayNext()
	}

	$effect(() => {
		// depend on messages array changes
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		$chatMessages[0]?.id

		// cancel previous displays
		tokens.forEach((token) => (token.cancelled = true))
		tokens = []

		startDisplay(queue1, (id) => (queue1Id = id), START_DELAY)
		startDisplay(queue2, (id) => (queue2Id = id), START_DELAY + 2000 * Math.random())
	})

	const message1 = $derived(queue1[queue1Id] || null)
	const message2 = $derived(queue2[queue2Id] || null)

	const message1Npc = $derived.by(() => {
		if (message1) {
			const id = message1.msg.created_at % charactarsThatCanSpeak.length
			return charactarsThatCanSpeak[id]
		}
		return null
	})

	const message2Npc = $derived.by(() => {
		if (message2) {
			let id = message2.msg.created_at % charactarsThatCanSpeak.length
			if (message1 && message1.msg.id === message2.msg.id) {
				// avoid showing the same message from two NPCs at the same time
				id = (id + 1) % charactarsThatCanSpeak.length
			}
			return charactarsThatCanSpeak[id]
		}
		return null
	})
</script>

{#each NPCList as npc (npc.cellId)}
	<NPCComponent
		{npc}
		message={npc.cellId === message1Npc?.cellId
			? message1.msg.text
			: npc.cellId === message2Npc?.cellId
				? message2.msg.text
				: undefined}
	/>
{/each}
