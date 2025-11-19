<script lang="ts">
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { hasStream } from '$lib/utils/streamUtils'
	import StreamPlayer from '$lib/components/streams/StreamPlayer.svelte'
	import StreamChat from '$lib/components/streams/StreamChat.svelte'
	import { derived } from 'svelte/store'
	import { onMount } from 'svelte'
	import type { PlayerData } from '$lib/types'

	const { players } = getAppManagerContext()

	const onlineStreamers = derived(players, ($players) => {
		return $players.filter((player) => player.is_online && hasStream(player))
	})

	let expandedStreamId = $state<string | null>(null)
	let showChat = $state(true)
	let visiblePlayers = $state<Set<string>>(new Set())
	let showAllPlayers = $state(true)
	let columnsCount = $state(4)

	let streamRefs: (HTMLDivElement | null)[] = []
	let containerRef: HTMLDivElement | null = null
	let previousStreams = new Set<string>()

	$effect(() => {
		const currentOnlineIds = new Set($onlineStreamers.map((player) => player.slug))
		const newPlayers = Array.from(currentOnlineIds).filter((id) => !previousStreams.has(id))

		if (previousStreams.size > 0 && newPlayers.length > 0) {
			visiblePlayers = new Set([...visiblePlayers, ...newPlayers])
		}

		previousStreams = currentOnlineIds
	})

	$effect(() => {
		if (showAllPlayers) {
			visiblePlayers = new Set($onlineStreamers.map((player) => player.slug))
		}
	})

	$effect(() => {
		if (expandedStreamId && !visiblePlayers.has(expandedStreamId)) {
			expandedStreamId = null
			showChat = true
		}
	})

	const filteredStreamers = $derived(
		$onlineStreamers.filter((player) => showAllPlayers || visiblePlayers.has(player.slug))
	)

	const expandedStreamIndex = $derived(
		expandedStreamId ? filteredStreamers.findIndex((player) => player.slug === expandedStreamId) : null
	)

	function handleToggleExpand(playerId: string) {
		if (expandedStreamId === playerId) {
			expandedStreamId = null
			showChat = true
		} else {
			expandedStreamId = playerId
			showChat = true
		}
	}

	function handleTogglePlayer(playerId: string) {
		const newVisiblePlayers = new Set(visiblePlayers)
		if (newVisiblePlayers.has(playerId)) {
			newVisiblePlayers.delete(playerId)
		} else {
			newVisiblePlayers.add(playerId)
		}
		visiblePlayers = newVisiblePlayers
		showAllPlayers = false

		if (expandedStreamId === playerId) {
			expandedStreamId = null
			showChat = true
		}
	}

	function handleShowAll() {
		showAllPlayers = true
		if (expandedStreamId) {
			expandedStreamId = null
			showChat = true
		}
	}

	function handleToggleChat() {
		showChat = !showChat
	}

	function handleGoHome() {
		window.location.href = '/'
	}

	function resetElementStyles() {
		streamRefs.forEach((ref) => {
			if (ref) {
				ref.style.position = ''
				ref.style.top = ''
				ref.style.left = ''
				ref.style.width = ''
				ref.style.height = ''
				ref.style.zIndex = ''
				ref.style.transition = ''
				ref.style.borderRadius = ''
				ref.style.display = ''
				ref.style.transform = ''
			}
		})
	}

	$effect(() => {
		if (
			expandedStreamIndex !== null &&
			expandedStreamIndex !== -1 &&
			typeof window !== 'undefined'
		) {
			const expandedPlayer = filteredStreamers[expandedStreamIndex]

			if (!visiblePlayers.has(expandedPlayer.slug)) {
				expandedStreamId = null
				showChat = true
				return
			}

			const expandedElementIndex = $onlineStreamers.findIndex(
				(p) => p.slug === expandedPlayer.slug
			)
			const expandedElement = streamRefs[expandedElementIndex]
			const container = containerRef

			if (expandedElement && container) {
				const containerRect = container.getBoundingClientRect()

				const chatWidth = showChat ? 320 : 0
				const elementHeight = 192
				const gap = 0
				const expandedWidth = containerRect.width - chatWidth

				const otherElements = filteredStreamers
					.map((_, i) => i)
					.filter((i) => i !== expandedStreamIndex)
					.map((i) => {
						const player = filteredStreamers[i]
						const refIndex = $onlineStreamers.findIndex((p) => p.slug === player.slug)
						const element = streamRefs[refIndex]
						return element && visiblePlayers.has(player.slug) ? element : null
					})
					.filter(Boolean) as HTMLDivElement[]

				const remainingCount = otherElements.length
				const rowsNeeded = remainingCount <= 6 ? 1 : Math.ceil(remainingCount / 6)
				const bottomAreaHeight =
					remainingCount === 0
						? 0
						: remainingCount <= 6
							? elementHeight + gap
							: rowsNeeded * elementHeight + (rowsNeeded - 1) * gap
				const expandedHeight =
					remainingCount === 0 ? window.innerHeight : window.innerHeight - bottomAreaHeight

				expandedElement.style.position = 'fixed'
				expandedElement.style.top = '0px'
				expandedElement.style.left = '0px'
				expandedElement.style.width = `${expandedWidth}px`
				expandedElement.style.height = `${expandedHeight}px`
				expandedElement.style.zIndex = '1000'
				expandedElement.style.transition = 'all 0.3s ease-in-out'
				expandedElement.style.borderRadius = '0px'

				let elementsPerRow: number, elementWidth: number

				const availableWidth = showChat ? containerRect.width - chatWidth : containerRect.width

				if (remainingCount <= 6) {
					elementsPerRow = remainingCount
					elementWidth = (availableWidth - (remainingCount - 1) * gap) / remainingCount
				} else {
					elementsPerRow = 6
					elementWidth = (availableWidth - 5 * gap) / 6
				}

				otherElements.forEach((element, i) => {
					if (element) {
						const row = Math.floor(i / elementsPerRow)
						const col = i % elementsPerRow

						let topPosition: number
						if (remainingCount === 0) {
							topPosition = window.innerHeight + 200
						} else if (remainingCount <= 6) {
							const totalBottomHeight = elementHeight + gap
							const bottomCenterY = window.innerHeight - totalBottomHeight
							topPosition = bottomCenterY
						} else {
							topPosition = expandedHeight + gap + row * (elementHeight + gap)
						}

						element.style.position = 'fixed'
						element.style.top = `${topPosition}px`
						element.style.left = `${col * (elementWidth + gap)}px`
						element.style.width = `${elementWidth}px`
						element.style.height = `${elementHeight}px`
						element.style.zIndex = '999'
						element.style.transition = 'all 0.3s ease-in-out'
						element.style.display = 'block'
					}
				})
			}
		} else {
			resetElementStyles()
		}
	})

	onMount(() => {
		visiblePlayers = new Set($onlineStreamers.map((player) => player.slug))
	})
</script>

{#if $onlineStreamers.length === 0}
	<div class="fixed inset-0 z-[99999] bg-[#282828] overflow-auto">
		<div class="container mx-auto px-4 py-8">
			<button onclick={handleGoHome} class="mb-6 rounded bg-transparent px-4 py-2 text-white hover:bg-white/10">
				Аукус
			</button>
			<div class="py-12 text-center">
				<h1 class="mb-4 text-2xl font-bold text-white">Стримы</h1>
				<p class="text-gray-300">Сейчас нет активных стримов</p>
			</div>
		</div>
	</div>
{:else}
	<div class="fixed inset-0 z-[99999] bg-[#282828] overflow-hidden">
		<div class="px-4 py-4">
			<div class="mb-4 flex items-center gap-4">
				<button onclick={handleGoHome} class="rounded bg-transparent px-4 py-2 text-white hover:bg-white/10">
					Аукус
				</button>

				<div class="flex flex-1 flex-wrap gap-2">
					<button
						onclick={handleShowAll}
						class="rounded px-3 py-1.5 text-sm text-white transition-colors {showAllPlayers
							? 'bg-[#8B5CF6]'
							: 'border border-white/20 bg-transparent hover:bg-white/10'}"
					>
						Все онлайн
					</button>
					{#each $onlineStreamers as player (player.slug)}
						<button
							onclick={() => handleTogglePlayer(player.slug)}
							class="rounded px-3 py-1.5 text-sm text-white transition-colors {visiblePlayers.has(player.slug) && !showAllPlayers
								? 'bg-[#8B5CF6]'
								: 'border border-white/20 bg-transparent hover:bg-white/10'}"
						>
							{player.username}
						</button>
					{/each}
				</div>

				<div class="flex items-center gap-2">
					<span class="text-sm text-white">Колонки:</span>
					<select
						bind:value={columnsCount}
						class="w-20 rounded border border-white/20 bg-white/10 px-2 py-1 text-white"
					>
						<option value={2}>2</option>
						<option value={3}>3</option>
						<option value={4}>4</option>
					</select>
				</div>
			</div>
		</div>

		<div bind:this={containerRef} class="relative w-full">
			<div class="grid gap-2" style="grid-template-columns: repeat({columnsCount}, 1fr)">
				{#each filteredStreamers as player, index (player.slug)}
					<div
						bind:this={streamRefs[$onlineStreamers.findIndex((p) => p.slug === player.slug)]}
						class="aspect-video"
					>
						<StreamPlayer
							{player}
							isExpanded={expandedStreamIndex === index}
							onToggleExpand={() => handleToggleExpand(player.slug)}
							onTogglePlayer={() => handleTogglePlayer(player.slug)}
							{showChat}
							onToggleChat={handleToggleChat}
							class="h-full"
							isFullHeight={expandedStreamIndex === index && filteredStreamers.length === 1}
						/>
					</div>
				{/each}
			</div>

			{#if expandedStreamIndex !== null && expandedStreamIndex !== -1}
				{#if showChat}
					<div class="fixed right-0 top-0 z-[9999] h-screen w-80 bg-white shadow-lg">
						<StreamChat player={filteredStreamers[expandedStreamIndex]} class="h-full" />
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}
