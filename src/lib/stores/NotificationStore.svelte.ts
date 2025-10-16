import { derived, writable } from 'svelte/store'
import type { EventDataStore } from './EventDataStore.svelte'

export function createNotificationStore({ eventDataStore }: { eventDataStore: EventDataStore }) {
	const achievementsIds = writable<number[]>([])

	const { achievementsById } = eventDataStore

	const achievements = derived(
		[achievementsIds, achievementsById],
		([$achievementsIds, $achievementsById]) => {
			return $achievementsIds.map((id) => $achievementsById.get(id)).filter((a) => !!a)
		}
	)

	function notify(ids: number[]) {
		achievementsIds.set(ids)
	}

	function hideNotification(id: number) {
		achievementsIds.update((ids) => ids.filter((i) => i !== id))
	}

	return {
		achievements,
		notify,
		hideNotification
	}
}
