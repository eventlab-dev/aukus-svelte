<script lang="ts">
	import ImageLoader from '../ImageLoader.svelte'
	import fallbackPoster from '$lib/assets/images/GameFallbackPoster.png'
	import GameStatusSelector from './components/GameStatusSelector.svelte'
	import HltbTimeSelector from './components/HLTBTimeSelector.svelte'
	import HltbLink from './components/HLTBLink.svelte'
	import Rating from './components/Rating.svelte'
	import { Button } from '../ui/button'
	import BoxIcon from '../icons/BoxIcon.svelte'
	import TiptapEditor from '../TiptapEditor.svelte'
	import { Editor } from '@tiptap/core'
	import GameTitle from './components/GameTitle.svelte'
	import EmotesPopover from './components/EmotesPopover.svelte'
	import { getAppManagerContext } from '$lib/contexts/appManagerContext'
	import {
		Dialog,
		DialogClose,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '../ui/dialog'
	import X from '@lucide/svelte/icons/x'
	import WandIcon from '../icons/WandIcon.svelte'
	import { get } from 'svelte/store'
	import type { GameLength, PlayerMoveType } from '$lib/heyapi/aukus/types.gen'

	type FormType = {
		title: string
		status?: PlayerMoveType
		hltbTime?: GameLength
		rating: number | null
		review: string
	}

	const { usersStore, eventDataStore } = getAppManagerContext()

	const { myUser, makeMove } = usersStore
	const { eventDataQuery } = eventDataStore

	let form: FormType = $state({
		title: '',
		status: undefined,
		hltbTime: undefined,
		rating: null,
		review: ''
	})

	let isDialogOpen = $state(false)
	let editorState: { editor: Editor | null } = $state({ editor: null })

	const isFormFilled = $derived.by(() => {
		if (!form.title) return false
		if (!form.status) return false
		if (!form.review) return false
		if (form.status === 'reroll') return true
		if (form.rating === null) return false
		if (form.status === 'drop' || form.status === 'movie' || form.status === 'sheikh_moment')
			return true
		if (!form.hltbTime) return false
		return true
	})

	async function saveReview() {
		// POST form
		console.log($state.snapshot(form))

		await get(makeMove).mutateAsync({
			body: {
				type: form.status!,
				item_review: form.review,
				item_rating: form.rating,
				item_length: form.hltbTime ?? null,
				item_title: form.title,
				// TODO: fill these fields
				game_id: null,
				difficulty: 0,
				dice_roll_id: null
			}
		})

		get(eventDataQuery).refetch()

		isDialogOpen = false

		setTimeout(() => {
			form = {
				title: '',
				status: undefined,
				hltbTime: undefined,
				rating: null,
				review: ''
			}
		}, 500)
	}

	function handleEmoteClick(emote: string) {
		editorState.editor?.chain().focus().setImage({ src: emote }).run()
	}

	function toggleSpoiler() {
		editorState.editor?.chain().focus().toggleSpoilerMark().setTextSelection(0).run()
	}
</script>

<Dialog bind:open={isDialogOpen}>
	<DialogTrigger>
		{#snippet child({ props })}
			<Button {...props} class="w-80">Сделать ход</Button>
		{/snippet}
	</DialogTrigger>
	<DialogContent class="gap-3 overflow-hidden p-3 sm:max-w-[800px]" showCloseButton={false}>
		<DialogHeader>
			<DialogTitle aria-describedby="move form">
				Новый ход — {$myUser?.current_game}
			</DialogTitle>
		</DialogHeader>

		<div class="flex gap-3">
			<ImageLoader src={fallbackPoster} alt="game poster" class="h-[176px] w-[132px]" />
			<div class="flex w-full flex-col gap-3">
				<GameTitle bind:value={form.title} />

				<div class="flex gap-3">
					<GameStatusSelector
						gameDuration={$myUser?.current_game_duration}
						bind:value={form.status}
					/>
					<HltbTimeSelector bind:value={form.hltbTime} disabled={form.status !== 'completed'} />
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
					<div class="absolute right-1.5 bottom-1.5 flex flex-col">
						<Button variant="ghost" size="icon" onclick={toggleSpoiler}>
							<WandIcon class="size-6" />
						</Button>
						<EmotesPopover onEmoteClick={handleEmoteClick} />
					</div>
				</div>

				<Button class="ml-auto w-[264px]" disabled={!isFormFilled} onclick={saveReview}>
					<BoxIcon /> Перейти к броску кубиков
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
