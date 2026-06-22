<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import ImageLoader from '$lib/components/ImageLoader.svelte'
	import { Input } from '$lib/components/ui/input'
	import { FALLBACK_GAME_POSTER } from '$lib/constants'
	import { debounce, defaultAuth } from '$lib/utils'
	import X from '@lucide/svelte/icons/x'
	import { fade, slide } from 'svelte/transition'
	import { ScrollArea } from '$lib/components/ui/scroll-area'
	import { onMount } from 'svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import { createQuery } from '@tanstack/svelte-query'
	import { searchIgdbGamesGetApiIgdbGamesSearchGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
	import { EventlabBaseUrl } from '$lib/client'
	import type { IgdbGameSummary } from '$lib/heyapi/eventlab/types.gen'
	import Loader from '$lib/components/Loader.svelte'

	type Props = {
		value: string
		selectedGame: IgdbGameSummary | null
	}

	let { value = $bindable(''), selectedGame = $bindable(null) }: Props = $props()

	const { myPlayer } = getAppManagerContext()

	let isFocused = $state(false)
	let inputRef: HTMLInputElement | null = $state(null)

	let searchQuery = $state('')

	const igdbSearchQuery = createQuery(() =>
		searchIgdbGamesGetApiIgdbGamesSearchGetOptions({
			baseUrl: EventlabBaseUrl,
			auth: defaultAuth,
			query: {
				query: searchQuery,
				limit: 10
			}
		})
	)

	const searchResults = $derived.by(() => {
		if (searchQuery === '' || !igdbSearchQuery.isSuccess) {
			return []
		}
		return igdbSearchQuery.data?.games || []
	})

	const isSearching = $derived(igdbSearchQuery.isFetching && searchQuery !== '')

	onMount(() => {
		if (myPlayer) {
			value = myPlayer.current_game || ''
			if (value) {
				searchQuery = value
			}
		}
		setTimeout(() => {
			inputRef?.focus()
		}, 100)
	})

	const debouncedInput = debounce((val: string) => {
		value = val
		searchQuery = val
		if (selectedGame && selectedGame.name !== val) {
			selectedGame = null
		}
	}, 400)

	function onGameClick(game: IgdbGameSummary) {
		value = game.name
		selectedGame = game
		searchQuery = ''
	}

	function onblur() {
		isFocused = false
	}

	function onfocus() {
		isFocused = true
	}
</script>

<div class="relative w-full">
	<Input
		bind:ref={inputRef}
		id="game-title"
		type="text"
		class="bg-muted"
		placeholder="Введите название игры"
		{value}
		{onfocus}
		{onblur}
		oninput={(e) => debouncedInput(e.currentTarget.value)}
	/>

	{#if (searchResults.length > 0 || isSearching) && isFocused}
		<div
			class="absolute top-full z-50 mt-1 flex max-h-60 w-full overflow-hidden rounded-lg bg-muted"
			transition:slide={{ duration: 200 }}
		>
			{#if isSearching}
				<div class="flex items-center justify-center p-4">
					<Loader class="mr-2 size-1" />
					Поиск...
				</div>
			{:else if searchResults.length > 0}
				<ScrollArea class="h-auto flex-1 overflow-hidden">
					<div>
						{#each searchResults as game (game.id)}
							<Button
								variant="secondary"
								class="bg-unset h-auto w-full justify-start gap-3 rounded-none p-2 text-start hover:bg-hover"
								onmousedown={() => onGameClick(game)}
							>
								<ImageLoader
									src={game.cover || FALLBACK_GAME_POSTER}
									alt={game.name}
									class="h-14 w-10 overflow-hidden rounded"
								/>
								<div class="">
									<div class="font-semibold">{game.name}</div>
									<div class="text-sm">{game.release_year}</div>
								</div>
							</Button>
						{/each}
					</div>
				</ScrollArea>
			{/if}
		</div>
	{/if}

	{#if value}
		<div class="absolute top-1/2 right-2 -translate-y-1/2" in:fade={{ duration: 200 }}>
			<Button
				variant="ghost"
				size="icon"
				class="bg-unset hover:bg-unset rounded-full opacity-70 hover:opacity-100"
				onclick={() => {
					value = ''
					selectedGame = null
				}}
			>
				<X class="size-4 stroke-3" />
			</Button>
		</div>
	{/if}
</div>
