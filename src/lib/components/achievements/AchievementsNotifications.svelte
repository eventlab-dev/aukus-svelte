<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { getSkinIconUrl } from '$lib/utils'
	import { Button } from '../ui/button'
	import { Dialog, DialogClose, DialogContent } from '../ui/dialog'

	const { notificationStore, eventDataStore } = getAppManagerContext()
	const { achievements, hideNotification } = notificationStore
	const { skinsById } = eventDataStore
</script>

{#each $achievements as achievement (achievement.id)}
	<Dialog open onOpenChange={() => hideNotification(achievement.id)}>
		<DialogContent showCloseButton={false} class="w-100">
			<div class="mb-2 text-lg">🏆 Достижение разблокировано!</div>
			<div class="flex justify-center p-4">
				<img
					class="h-20"
					src={getSkinIconUrl($skinsById.get(achievement.reward_skin_id)?.image_url ?? '')}
					alt="skin"
				/>
			</div>
			<div class="mt-1 text-xs text-muted-foreground">{achievement.description}</div>
			<DialogClose onclick={() => hideNotification(achievement.id)}>
				<Button>Круто!</Button>
			</DialogClose>
		</DialogContent>
	</Dialog>
{/each}
