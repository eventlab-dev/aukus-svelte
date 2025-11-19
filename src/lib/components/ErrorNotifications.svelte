<script lang="ts">
	import type { ErrorNotificationStore } from '$lib/stores/ErrorNotificationStore.svelte'
	import ErrorNotificationItem from './ErrorNotificationItem.svelte'

	let { errorNotificationStore }: { errorNotificationStore: ErrorNotificationStore } = $props()

	const { notifications, removeError } = errorNotificationStore
</script>

<div class="fixed bottom-0 left-0 right-0 z-50 flex flex-col-reverse gap-2 p-4">
	{#each $notifications as notification (notification.id)}
		<ErrorNotificationItem {notification} onRemove={() => removeError(notification.id)} />
	{/each}
</div>

