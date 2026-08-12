<script lang="ts">
	import ImageLoader from '$lib/components/ImageLoader.svelte'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { debounce } from 'perfect-debounce'
	import { onMount } from 'svelte'
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
	import EmojiIcon from '$lib/components/icons/EmojiIcon.svelte'
	import { searchEmotes, type EmoteItem } from '$lib/api/emotes'
	import Loader from '$lib/components/Loader.svelte'

	type Props = {
		onEmoteClick: (emote: EmoteItem) => void
	}

	const { onEmoteClick }: Props = $props()

	let emotes = $state<EmoteItem[]>([])
	let searchQuery = $state('')
	let isFetching = $state(false)
	let searchInputRef: HTMLInputElement | undefined = $state()

	async function fetchEmotes(query: string) {
		isFetching = true
		try {
			const response = await searchEmotes({
				search_term: query,
				limit: 28
			})
			emotes = response.emotes
		} catch (error) {
			console.error('Failed to fetch emotes:', error)
			emotes = []
		} finally {
			isFetching = false
		}
	}

	const debouncedFetch = debounce(async (val: string) => {
		searchQuery = val
		await fetchEmotes(val)
	}, 400)

	onMount(() => {
		searchInputRef?.focus()
		fetchEmotes('')
	})
</script>

<Popover>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon">
				<EmojiIcon class="size-6" />
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent class="w-fit">
		<div>
			<Input
				ref={searchInputRef}
				id="emotes-search"
				type="text"
				class="mb-2 w-full bg-muted"
				placeholder="Поиск смайлов..."
				value={searchQuery}
				oninput={(e) => debouncedFetch(e.currentTarget.value)}
			/>

			<div class="h-[calc(4_*_48px)] w-[calc(7_*_48px)]">
				{#if isFetching}
					<div class="flex h-full w-full items-center justify-center">
						<Loader class="size-6 text-primary" />
					</div>
				{:else if emotes && emotes.length > 0}
					<div class="grid grid-cols-[repeat(7,48px)] grid-rows-[repeat(4,48px)]">
						{#each emotes as emote (emote.id)}
							<Button
								variant="ghost"
								size="icon"
								class="h-full w-full p-1.5"
								onclick={() => onEmoteClick(emote)}
								title={emote.name}
							>
								<ImageLoader
									src={emote.cdn_url}
									alt={emote.name}
									class="h-full w-full overflow-visible"
								/>
							</Button>
						{/each}
					</div>
				{:else}
					<div class="flex h-full items-center justify-center text-sm text-white/70">
						Смайлы не найдены
					</div>
				{/if}
			</div>
		</div>
	</PopoverContent>
</Popover>
