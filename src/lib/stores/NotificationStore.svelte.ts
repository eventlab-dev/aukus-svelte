import { EventlabBaseUrl } from '$lib/client'
import type { AchievementItem, UnlockedAchievementItem } from '$lib/heyapi/aukus/types.gen'
import { getNotificationsApiNotificationsGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import { createQuery } from '@tanstack/svelte-query'
import { SvelteMap } from 'svelte/reactivity'

type PersonalAchievement = AchievementItem & { is_first: boolean }

type Params = {
	getAchievementsById: () => SvelteMap<number, AchievementItem>
}

export class NotificationStore {
	constructor(params: Params) {
		this.getAchievementsById = params.getAchievementsById

		$effect(() => {
			if (this.notifications && this.notifications.length) {
				const maxTs = Math.max(...this.notifications.map((n) => n.created_at))
				if (maxTs > this.notificationsTimestamp) {
					this.notificationsTimestamp = maxTs
				}
			}
		})
	}

	getAchievementsById: () => SvelteMap<number, AchievementItem>

	unlockedAchievements = $state<UnlockedAchievementItem[]>([])
	achievements = $derived(
		this.unlockedAchievements
			.map((a) => {
				const achievement = this.getAchievementsById().get(a.id)
				if (!achievement) {
					return null
				}
				return { ...achievement, is_first: a.is_first }
			})
			.filter((a) => !!a) as PersonalAchievement[]
	)

	notifyAchievements(items: UnlockedAchievementItem[]) {
		this.unlockedAchievements = items
	}

	hideAchievementNotification(id: number) {
		this.unlockedAchievements = this.unlockedAchievements.filter((i) => i.id !== id)
	}

	notificationsTimestamp = Math.floor(Temporal.Now.instant().epochMilliseconds / 1000)

	notificationsQuery = createQuery(() => {
		const params = getNotificationsApiNotificationsGetOptions({
			baseUrl: EventlabBaseUrl,
			query: {
				since_timestamp: this.notificationsTimestamp
			}
		})
		params.refetchInterval = 1000 * 60
		return params
	})

	notifications = $derived(this.notificationsQuery.data?.notifications)
}
