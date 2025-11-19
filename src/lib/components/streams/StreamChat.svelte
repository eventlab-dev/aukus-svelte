<script lang="ts">
	import type { PlayerData } from '$lib/types'
	import { getChatUrl } from '$lib/utils/streamUtils'

	let { player, class: className = '' }: { player: PlayerData; class?: string } = $props()

	const chatUrl = $derived(getChatUrl(player))
</script>

{#if !chatUrl}
	<div class="flex h-full items-center justify-center rounded-lg bg-gray-100 {className}">
		<span class="text-gray-500">Чат недоступен</span>
	</div>
{:else}
	<div class="overflow-hidden bg-[#282828] {className}">
		<div class="border-b border-gray-700 bg-[#1a1a1a] px-3 py-2">
			<span class="text-sm font-medium text-white">Чат {player.username}</span>
		</div>
		<iframe
			src={chatUrl}
			class="h-[calc(100%-40px)] w-full"
			title="Chat for {player.username}"
			sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals"
		></iframe>
	</div>
{/if}

