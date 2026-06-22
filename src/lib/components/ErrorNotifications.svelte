<script lang="ts">
	import type { ErrorNotificationStore } from '$lib/stores/ErrorNotificationStore.svelte'
	import ErrorNotificationItem from './ErrorNotificationItem.svelte'

	let { errorNotificationStore }: { errorNotificationStore: ErrorNotificationStore } = $props()
</script>

<div class="fixed bottom-0 left-0 right-0 z-50 flex flex-col-reverse gap-2 p-4" class:pointer-events-none={errorNotificationStore.notifications.length === 0}>
	{#each errorNotificationStore.notifications as notification (notification.id)}
		<div class="pointer-events-auto">
			<ErrorNotificationItem {notification} onRemove={() => errorNotificationStore.removeError(notification.id)} />
		</div>
	{/each}
</div>

