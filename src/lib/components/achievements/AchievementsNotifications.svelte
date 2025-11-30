<script lang="ts">
	import { AchievementBackgroundUrl } from '$lib/constants'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { getConfirmationText } from '$lib/utils'
	import SkinPreview from '../skinEditor/SkinPreview.svelte'
	import { Button } from '../ui/button'
	import { Dialog, DialogClose, DialogContent } from '../ui/dialog'

	const { notificationStore, eventDataStore } = getAppManagerContext()
	const { achievements, hideNotification } = notificationStore
	const { skinsById } = eventDataStore

	const achievement = $derived<(typeof $achievements)[0] | undefined>($achievements[0])

	const skin = $derived(achievement ? $skinsById.get(achievement.reward_skin_id) : null)

	let buttonText = $state(getConfirmationText())

	const handleOpenChange = (isOpen: boolean) => {
		if (!isOpen && achievement) {
			hideNotification(achievement.id)
			buttonText = getConfirmationText()
		}
	}
</script>

{#if achievement && skin}
	{#key achievement.id}
		<Dialog open onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={false} class="w-fit">
				<div class="mb-0 flex justify-center text-3xl">Достижение разблокировано!</div>
				<div class="relative flex justify-center">
					<img class="h-63 rounded-2xl" src={AchievementBackgroundUrl} alt="background" />
					<div class="absolute top-1/2 left-1/2 h-16 -translate-x-1/2 -translate-y-1/2">
						<SkinPreview {skin} />
					</div>
				</div>
				<div>{achievement.description}</div>

				<div class="mt-2 flex gap-2 text-sm">
					{#if achievement.is_first}
						<div>Ты первый кто открыл это достижение!</div>
					{/if}
					{#if achievement.points}
						<div>+3 очка</div>
					{/if}
				</div>
				<DialogClose>
					<Button class="w-full">{buttonText}</Button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	{/key}
{/if}
