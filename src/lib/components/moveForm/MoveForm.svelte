<script lang="ts">
	import ImageLoader from '../ImageLoader.svelte'
	import fallbackPoster from '$lib/assets/images/GameFallbackPoster.png'
	import GameStatusSelector from './components/GameStatusSelector.svelte'
	import HltbTimeSelector from './components/HLTBTimeSelector.svelte'
	import HltbLink from './components/HLTBLink.svelte'
	import Rating from './components/Rating.svelte'
	import { Button } from '../ui/button'
	import BoxIcon from '../icons/BoxIcon.svelte'
	import TiptapEditor from '../richEditor/TiptapEditor.svelte'
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
	import type { GameLength, PlayerMoveType } from '$lib/heyapi/aukus/types.gen'
	import type { IgdbGameSummary } from '$lib/heyapi/eventlab/types.gen'
	import { LastMapPosition } from '$lib/constants'
	import { EventlabBaseUrl } from '$lib/client'
	import { getGameDurationApiStreamsGameDurationGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
	import { defaultAuth } from '$lib/utils'
	import { createQuery } from '@tanstack/svelte-query'
	import { derived, writable } from 'svelte/store'

	type FormType = {
		title: string
		status?: PlayerMoveType
		hltbTime?: GameLength
		rating: number | null
		review: string
	}

	type GameDurationResponse = {
		duration: number
		sessions_count: number
		event_slug?: string
		error?: string
	}

	const { usersStore, eventDataStore, myPlayer, frontendState } = getAppManagerContext()

	const { saveMoveForm } = usersStore
	const { eventDataQuery } = eventDataStore

	let form: FormType = $state({
		title: '',
		status: undefined,
		hltbTime: undefined,
		rating: null,
		review: ''
	})

	let selectedGame: IgdbGameSummary | null = $state(null)
	let isDialogOpen = $state(false)
	let editorState: { editor: Editor | null } = $state({ editor: null })

	const selectedGameStore = writable<IgdbGameSummary | null>(null)
	
	$effect(() => {
		selectedGameStore.set(selectedGame)
	})

	const gameDurationQuery = createQuery(
		derived([myPlayer, selectedGameStore], ([$myPlayer, $selectedGame]) => {
			const options = getGameDurationApiStreamsGameDurationGetOptions({
				baseUrl: EventlabBaseUrl,
				auth: defaultAuth,
				query: {
					slug: $myPlayer?.slug || '',
					game_name: $selectedGame?.name || ''
				}
			})
			options.enabled = Boolean($selectedGame && $myPlayer)
			options.staleTime = 0
			options.gcTime = 0
			return options
		})
	)

	const gameDuration = $derived.by(() => {
		const response = $gameDurationQuery.data as GameDurationResponse | undefined
		if (selectedGame && response && response.duration !== undefined) {
			return response.duration
		}
		return $myPlayer?.current_game_duration
	})

	const { isFormFilled, buttonText } = $derived.by(() => {
		if (!form.title) return { isFormFilled: false, buttonText: 'Введи название игры' }
		if (!form.status) return { isFormFilled: false, buttonText: 'Выбери статус игры' }
		if (!form.review) return { isFormFilled: false, buttonText: 'Напиши отзыв' }
		if (form.status === 'reroll') return { isFormFilled: true, buttonText: 'Рерольнуть игру' }
		if (form.rating === null) return { isFormFilled: false, buttonText: 'Поставь оценку' }
		if (form.status === 'drop' || form.status === 'sheikh_moment') {
			return { isFormFilled: true, buttonText: 'Дропнуть игру' }
		}
		if (form.status === 'movie')
			return { isFormFilled: true, buttonText: 'Перейти к броску кубиков' }
		if (!form.hltbTime) return { isFormFilled: false, buttonText: 'Выбери время по HLTB' }

		if ($myPlayer?.map_position === LastMapPosition) {
			return { isFormFilled: true, buttonText: 'Победить в АУКУСЕ 4' }
		}
		return { isFormFilled: true, buttonText: 'Перейти к броску кубиков' }
	})

	async function saveReview() {
		await $saveMoveForm.mutateAsync({
			body: {
				type: form.status!,
				item_review: form.review,
				item_rating: form.rating,
				item_length: form.hltbTime || null,
				item_title: form.title,
				game_id: selectedGame?.id || null,
				cover_image_url: selectedGame?.cover || fallbackPoster,
				// TODO: fill these fields
				difficulty: 0
			}
		})

		frontendState.set('form-sent')

		isDialogOpen = false

		$eventDataQuery.refetch()

		setTimeout(() => {
			form = {
				title: '',
				status: undefined,
				hltbTime: undefined,
				rating: null,
				review: ''
			}
			selectedGame = null
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
				Новый ход — {$myPlayer?.current_game}
			</DialogTitle>
		</DialogHeader>

		<div class="flex gap-3">
			<ImageLoader
				src={selectedGame?.cover || fallbackPoster}
				alt="game poster"
				class="h-[176px] w-[132px]"
			/>
			<div class="flex w-full flex-col gap-3">
				<GameTitle bind:value={form.title} bind:selectedGame />

				<div class="flex gap-3">
					<GameStatusSelector {gameDuration} bind:value={form.status} />
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
						extensions={{
							placeholderText: 'Отзыв об игре'
						}}
						simple
					/>
					<div class="absolute bottom-1.5 right-1.5 flex flex-col">
						<Button variant="ghost" size="icon" onclick={toggleSpoiler}>
							<WandIcon class="size-6" />
						</Button>
						<EmotesPopover onEmoteClick={handleEmoteClick} />
					</div>
				</div>

				<Button class="ml-auto w-[264px]" disabled={!isFormFilled} onclick={saveReview}>
					<BoxIcon />
					{buttonText}
				</Button>
			</div>
		</div>

		<DialogClose
			class="absolute right-3 top-3 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
		>
			<X class="stroke-4 size-5" />
		</DialogClose>
	</DialogContent>
</Dialog>
