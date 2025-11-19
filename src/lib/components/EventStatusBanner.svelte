<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'

	const { eventNotStarted, eventFinished, eventDataStore } = getAppManagerContext()
	const { eventSettings } = eventDataStore

	function formatDateToMSK(timestamp: number): string {
		const date = new Date(timestamp * 1000)
		const formatter = new Intl.DateTimeFormat('ru-RU', {
			timeZone: 'Europe/Moscow',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
		return formatter.format(date)
	}

	const bannerText = $derived.by(() => {
		if ($eventNotStarted && $eventSettings?.event_start_time) {
			const dateStr = formatDateToMSK(Number($eventSettings.event_start_time))
			return `Ивент начнется ${dateStr} MSK`
		}
		if ($eventFinished) {
			return 'Ивент завершён'
		}
		return null
	})

	const shouldShowBanner = $derived($eventNotStarted || $eventFinished)
</script>

{#if shouldShowBanner && bannerText}
	<div
		class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center bg-primary px-4 py-5 text-center text-xl font-semibold text-primary-foreground shadow-lg"
	>
		{bannerText}
	</div>
{/if}

