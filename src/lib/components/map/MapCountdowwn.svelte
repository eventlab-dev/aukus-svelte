<script lang="ts">
	import { formatMs } from '$lib/utils'
	import { Button } from '../ui/button'
	import { getAppManager } from '$lib/stores/AppManager.svelte'

	const app = getAppManager()
	const { eventDataStore } = app

	const startTs = $derived.by(() => {
		if (!eventDataStore.eventSettings || !eventDataStore.eventSettings.event_start_time) {
			return null
		}
		return Number(eventDataStore.eventSettings.event_start_time) * 1000
	})

	const endTs = $derived.by(() => {
		if (!eventDataStore.eventSettings || !eventDataStore.eventSettings.event_end_time) {
			return null
		}
		return Number(eventDataStore.eventSettings.event_end_time) * 1000
	})

	let nowTs = $state(Date.now())

	$effect(() => {
		const interval = setInterval(() => {
			nowTs = Date.now()
		}, 1000)
		return () => clearInterval(interval)
	})

	const { text, timeLeft } = $derived.by(() => {
		if (startTs !== null && nowTs < startTs) {
			return { text: 'До начала', timeLeft: startTs - nowTs }
		}
		if (endTs !== null && nowTs < endTs) {
			return { text: 'До конца', timeLeft: endTs - nowTs }
		}
		return { text: '', timeLeft: 0 }
	})
</script>

<!-- {#if timeLeft > 0}
	<div class="absolute top-105 left-216 w-[160px] text-center text-xl text-black">
		<div>{text}</div>
		<div>{formatMs(timeLeft)}</div>
	</div>
{:else}
	<div class="absolute top-105 left-216 w-[160px] text-center text-xl text-black">
		<Button variant="link" class="p-0 text-black!" href="/presentation">Итоги</Button>
	</div>
{/if} -->
