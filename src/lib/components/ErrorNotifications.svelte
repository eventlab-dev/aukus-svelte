<script lang="ts">
	import type { ErrorNotificationStore } from '$lib/stores/ErrorNotificationStore.svelte'
	import XIcon from './icons/XIcon.svelte'

	let { errorNotificationStore }: { errorNotificationStore: ErrorNotificationStore } = $props()

	const { notifications, removeError } = errorNotificationStore
</script>

<div class="fixed top-0 left-0 right-0 z-50 flex flex-col gap-2 p-4">
	{#each $notifications as notification (notification.id)}
		<div
			class="flex items-center justify-between gap-4 rounded-lg bg-red-600 px-4 py-3 text-white shadow-lg"
		>
			<div class="flex-1">
				<div class="flex items-center gap-2">
					<span class="font-semibold">Error {notification.statusCode}</span>
					<span class="text-sm opacity-90">{notification.path}</span>
				</div>
				<div class="mt-1 text-sm">{notification.message}</div>
			</div>
			<button
				onclick={() => removeError(notification.id)}
				class="flex-shrink-0 rounded hover:bg-red-700 p-1 transition-colors"
				aria-label="Close notification"
			>
				<XIcon class="h-5 w-5" />
			</button>
		</div>
	{/each}
</div>

