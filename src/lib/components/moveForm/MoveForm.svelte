<script lang="ts">
	import ImageLoader from '../ImageLoader.svelte';
	import fallbackPoster from '$lib/assets/images/GameFallbackPoster.png';
	import GameStatusSelector from './components/GameStatusSelector.svelte';
	import HltbTimeSelector from './components/HLTBTimeSelector.svelte';
	import HltbLink from './components/HLTBLink.svelte';
	import type { ItemLength, MoveType } from '$lib/api/aukus/types';
	import Rating from './components/Rating.svelte';
	import { Button } from '../ui/button';
	import BoxIcon from '../icons/BoxIcon.svelte';
	import TiptapEditor from '../TiptapEditor.svelte';
	import { Editor } from '@tiptap/core';
	import GameTitle from './components/GameTitle.svelte';
	import EmotesPopover from './components/EmotesPopover.svelte';
	import { getAppManagerContext } from '$lib/contexts/appManagerContext';
	import {
		Dialog,
		DialogClose,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '../ui/dialog';
	import X from '@lucide/svelte/icons/x';

	type FormType = {
		title: string;
		status?: MoveType;
		hltbTime?: ItemLength;
		rating: number | null;
		review: string;
	};

	const { myPlayer } = getAppManagerContext();

	let form: FormType = $state({
		title: '',
		status: undefined,
		hltbTime: undefined,
		rating: null,
		review:
			'{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Hello Svelte! 🌍️"}]},{"type":"paragraph","content":[{"type":"text","text":"This editor is running in Svelte."}]},{"type":"paragraph","content":[{"type":"text","text":"Select some text to see"},{"type":"image","attrs":{"src":"https://cdn.7tv.app/emote/01F6MQ33FG000FFJ97ZB8MWV52/1x.avif","alt":null,"title":null,"width":null,"height":null}},{"type":"text","text":" the bubble menu"},{"type":"image","attrs":{"src":"https://cdn.7tv.app/emote/01F6N31ETR0004P7N4A9PKS5X9/1x.avif","alt":null,"title":null,"width":null,"height":null}},{"type":"text","text":" popping up."}]}]}'
	});

	let isDialogOpen = $state(false);
	let editorState: { editor: Editor | null } = $state({ editor: null });

	const isFormFilled = $derived(
		form.title && form.status && form.hltbTime && form.rating !== null && form.review
	);

	function saveReview() {
		// POST form
		console.log($state.snapshot(form));

		isDialogOpen = false;

		setTimeout(() => {
			form = {
				title: '',
				status: undefined,
				hltbTime: undefined,
				rating: null,
				review: ''
			};
		}, 500);
	}

	function handleEmoteClick(emote: string) {
		editorState.editor?.chain().focus().setImage({ src: emote }).run();
	}
</script>

<Dialog bind:open={isDialogOpen}>
	<DialogTrigger>
		{#snippet child({ props })}
			<Button {...props}>Сделать ход</Button>
		{/snippet}
	</DialogTrigger>
	<DialogContent class="gap-3 overflow-hidden p-3 sm:max-w-[800px]" showCloseButton={false}>
		<DialogHeader>
			<DialogTitle aria-describedby="move form">
				Новый ход — {myPlayer?.current_game}
			</DialogTitle>
		</DialogHeader>

		<div class="flex gap-3">
			<ImageLoader src={fallbackPoster} alt="game poster" class="h-[176px] w-[132px]" />
			<div class="flex w-full flex-col gap-3">
				<GameTitle bind:value={form.title} />

				<div class="flex gap-3">
					<GameStatusSelector
						gameDuration={myPlayer?.current_game_duration}
						bind:value={form.status}
					/>
					<HltbTimeSelector bind:value={form.hltbTime} />
					<HltbLink gameTitle={form.title} />
				</div>

				<div class="space-y-2.5">
					<div class="text-xl font-semibold">
						Оценка — {`${form.rating === null ? 'не указана' : form.rating}`}
					</div>
					<Rating bind:value={form.rating} />
				</div>

				<div class="relative">
					<TiptapEditor
						class="pr-8"
						content={form.review}
						bind:editorState
						bind:value={form.review}
					/>
					<EmotesPopover onEmoteClick={handleEmoteClick} />
				</div>

				<Button class="ml-auto w-[264px]" disabled={!isFormFilled} onclick={saveReview}>
					<BoxIcon /> Кинуть кубики
				</Button>
			</div>
		</div>

		<DialogClose
			class="absolute top-3 right-3 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
		>
			<X class="size-5 stroke-4" />
		</DialogClose>
	</DialogContent>
</Dialog>
