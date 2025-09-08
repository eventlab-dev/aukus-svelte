<script lang="ts">
	import ImageLoader from '$lib/components/ImageLoader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { debounce } from '$lib/utils';
	import { onMount } from 'svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import EmojiIcon from '$lib/components/icons/EmojiIcon.svelte';

	type Props = {
		onEmoteClick: (emote: string) => void;
	};

	const { onEmoteClick }: Props = $props();

	const emoteData = {
		emotes: [
			'https://cdn.7tv.app/emote/01F6N31ETR0004P7N4A9PKS5X9/1x.avif',
			'https://cdn.7tv.app/emote/01JTVCAPVDNDBCT44MCMTYH5T0/1x.avif',
			'https://cdn.7tv.app/emote/01J8DX4H6G000C93G7AYMMN99D/1x.avif',
			'https://cdn.7tv.app/emote/01K1KQ1X1M8K7XME2MZVDRMKRS/1x.avif',
			'https://cdn.7tv.app/emote/01JDBDSNMQCZ7Z89PRZ712RM5N/1x.avif',
			'https://cdn.7tv.app/emote/01JQJ1T4ZQKECNYSA1K47RMPQR/1x.avif',
			'https://cdn.7tv.app/emote/01G4ZTECKR0002P97QQ94BDSP4/1x.avif',
			'https://cdn.7tv.app/emote/01FZ975PV8000B4AWRZNMVNEXN/1x.avif',
			'https://cdn.7tv.app/emote/01F7M225F8000AWSXNQ65M4PKG/1x.avif',
			'https://cdn.7tv.app/emote/01HYJN039G000396FKBWMCE2WR/1x.avif',
			'https://cdn.7tv.app/emote/01F6MA6Y100002B6P5MWZ5D916/1x.avif',
			'https://cdn.7tv.app/emote/01F6MMZW3R00012ZP6HJJ38G2E/1x.avif',
			'https://cdn.7tv.app/emote/01FBDZWBCG00072B7YSZWSNQNK/1x.avif',
			'https://cdn.7tv.app/emote/01F85F0A28000E14C9J6VJDGKD/1x.avif'
		]
	};

	let searchQuery = $state('');
	let isFetching = $state(false);
	let searchInputRef: HTMLInputElement | undefined = $state();

	const debouncedInput = debounce((val: string) => {
		searchQuery = val;
	}, 400);

	onMount(() => searchInputRef?.focus());
</script>

<Popover>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class="absolute right-3 bottom-1.5">
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
				oninput={(e) => debouncedInput(e.currentTarget.value)}
			/>

			<div class="h-[calc(4_*_48px)] w-[calc(7_*_48px)]">
				{#if isFetching && searchQuery.length >= 2}
					<div class="flex h-full w-full items-center justify-center">
						<LoaderCircleIcon class="size-6 animate-spin text-primary" />
					</div>
				{:else if emoteData?.emotes && emoteData.emotes.length > 0}
					<div class="grid grid-cols-[repeat(7,48px)] grid-rows-[repeat(4,48px)]">
						{#each emoteData.emotes as emoteUrl}
							<Button
								variant="ghost"
								size="icon"
								class="h-full w-full p-1.5"
								onclick={() => onEmoteClick(emoteUrl)}
							>
								<ImageLoader src={emoteUrl} alt="emote" class="h-full w-full overflow-visible" />
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
