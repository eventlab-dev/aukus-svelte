<script lang="ts">
	import { AchievementBackgroundUrl } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import type { AchievementItem } from '$lib/heyapi/aukus/types.gen'
	import { getSkinIconUrl } from '$lib/utils'
	import { Button } from '../ui/button'
	import { Dialog, DialogClose, DialogContent } from '../ui/dialog'

	const { notificationStore, eventDataStore } = getAppManagerContext()
	const { achievements, hideNotification } = notificationStore
	const { skinsById } = eventDataStore

	const achievement = $derived<AchievementItem | undefined>($achievements[0])

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen && achievement) {
			hideNotification(achievement.id)
		}
	}
</script>

{#if achievement}
	{#key achievement.id}
		<Dialog open onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={false} class="w-fit">
				<div class="mb-0 flex justify-center text-lg">🏆 Достижение разблокировано!</div>
				<div class="relative flex justify-center">
					<img class="h-40 rounded-2xl" src={AchievementBackgroundUrl} alt="background" />
					<img
						class="absolute top-1/2 left-1/2 h-16 -translate-x-1/2 -translate-y-1/2"
						src={getSkinIconUrl($skinsById.get(achievement.reward_skin_id)?.image_url ?? '')}
						alt="skin"
					/>
				</div>
				<div>{achievement.description}</div>
				<DialogClose>
					<Button>Круто!</Button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	{/key}
{/if}
