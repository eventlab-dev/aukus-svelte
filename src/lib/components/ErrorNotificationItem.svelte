<script lang="ts">
	import { onMount } from 'svelte'
	import type { ErrorNotification } from '$lib/stores/ErrorNotificationStore.svelte'
	import XIcon from './icons/XIcon.svelte'

	let {
		notification,
		onRemove
	}: {
		notification: ErrorNotification
		onRemove: () => void
	} = $props()

	const DURATION = 10000
	let progress = $state(100)
	let isPaused = $state(false)
	let timeoutId: number | undefined = $state()
	let startTime = $state(Date.now())
	let remainingTime = $state(DURATION)

	function startTimer() {
		startTime = Date.now()
		timeoutId = window.setTimeout(() => {
			onRemove()
		}, remainingTime)
	}

	function pauseTimer() {
		if (!isPaused && timeoutId) {
			clearTimeout(timeoutId)
			remainingTime = remainingTime - (Date.now() - startTime)
			isPaused = true
		}
	}

	function resumeTimer() {
		if (isPaused) {
			isPaused = false
			startTimer()
		}
	}

	onMount(() => {
		startTimer()

		const interval = setInterval(() => {
			if (!isPaused) {
				const elapsed = Date.now() - startTime
				progress = Math.max(0, 100 - (elapsed / DURATION) * 100)
			}
		}, 50)

		return () => {
			clearInterval(interval)
			if (timeoutId) {
				clearTimeout(timeoutId)
			}
		}
	})
</script>

<div
	class="relative flex items-center justify-between gap-4 rounded-lg bg-red-600 px-4 py-3 text-white shadow-lg overflow-hidden"
	onmouseenter={pauseTimer}
	onmouseleave={resumeTimer}
	role="alert"
>
	<div class="flex-1">
		<div class="flex items-center gap-2">
			<span class="font-semibold">Error {notification.statusCode}</span>
			<span class="text-sm opacity-90">{notification.path}</span>
		</div>
		<div class="mt-1 text-sm">{notification.message}</div>
	</div>
	<button
		onclick={onRemove}
		class="flex-shrink-0 rounded hover:bg-red-700 p-1 transition-colors z-10"
		aria-label="Close notification"
	>
		<XIcon class="h-5 w-5" />
	</button>

	<div
		class="absolute bottom-0 left-0 h-1 bg-red-800 transition-all duration-[50ms] ease-linear"
		style="width: {progress}%"
	></div>
</div>

