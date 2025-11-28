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
	import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
	import { Editor } from '@tiptap/core'
	import GameTitle from './components/GameTitle.svelte'
	import EmotesPopover from './components/EmotesPopover.svelte'
	import type { EmoteItem } from '$lib/api/emotes'
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
	import type { GameDifficulty, GameLength, PlayerMoveType } from '$lib/heyapi/aukus/types.gen'
	import type { IgdbGameSummary } from '$lib/heyapi/eventlab/types.gen'
	import { LastMapPosition } from '$lib/constants'
	import { EventlabBaseUrl } from '$lib/client'
	import { getGameDurationApiStreamsGameDurationGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
	import { defaultAuth } from '$lib/utils'
	import { createQuery } from '@tanstack/svelte-query'
	import { derived, writable } from 'svelte/store'
	import DifficultySelector from './components/DifficultySelector.svelte'
	import type { Difficulty } from '$lib/types'

	type FormType = {
		title: string
		status?: PlayerMoveType
		hltbTime?: GameLength
		rating: number | null
		review: string
		difficulty?: Difficulty
	}

	type GameDurationResponse = {
		duration: number
		sessions_count: number
		event_slug?: string
		error?: string
	}

	const { usersStore, eventDataStore, myPlayer, frontendState, eventActive } =
		getAppManagerContext()

	const { saveMoveForm } = usersStore
	const { eventDataQuery } = eventDataStore

	let form: FormType = $state({
		title: '',
		status: undefined,
		hltbTime: undefined,
		rating: null,
		review: '',
		difficulty: undefined
	})

	let selectedGame: IgdbGameSummary | null = $state(null)
	let isDialogOpen = $state(false)
	let editorState: { editor: Editor | null } = $state({ editor: null })
	let isHltbTimeInvalid = $state(false)
	let bypassClickCount = $state(0)

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
		return undefined
	})

	const { isFormFilled, buttonText, hasHltbError } = $derived.by(() => {
		if (!form.title) return { isFormFilled: false, buttonText: 'Введи название игры', hasHltbError: false }
		if (!form.status) return { isFormFilled: false, buttonText: 'Выбери статус игры', hasHltbError: false }
		if (!form.review) return { isFormFilled: false, buttonText: 'Напиши отзыв', hasHltbError: false }
		if (form.status === 'reroll') return { isFormFilled: true, buttonText: 'Рерольнуть игру', hasHltbError: false }
		if (form.rating === null) return { isFormFilled: false, buttonText: 'Поставь оценку', hasHltbError: false }
		if (!form.difficulty) return { isFormFilled: false, buttonText: 'Выбери сложность', hasHltbError: false }
		if (form.status === 'drop' || form.status === 'sheikh_moment') {
			return { isFormFilled: true, buttonText: 'Дропнуть игру', hasHltbError: false }
		}
		if (form.status === 'movie')
			return { isFormFilled: true, buttonText: 'Перейти к броску кубиков', hasHltbError: false }
		if (!form.hltbTime) return { isFormFilled: false, buttonText: 'Выбери время', hasHltbError: false }

		if ($myPlayer?.map_position === LastMapPosition) {
			return { isFormFilled: true, buttonText: 'Победить в АУКУСЕ 4', hasHltbError: isHltbTimeInvalid }
		}
		return { isFormFilled: true, buttonText: 'Перейти к броску кубиков', hasHltbError: isHltbTimeInvalid }
	})

	async function saveReview() {
		let difficulty: GameDifficulty = 0
		switch (form.difficulty) {
			case 'easy':
				difficulty = -1
				break
			case 'normal':
				difficulty = 0
				break
			case 'hard':
				difficulty = 1
				break
			case 'very-hard':
				difficulty = 2
				break
			case undefined:
				difficulty = 0
				break
			default: {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const _exhaustiveCheck: never = form.difficulty
				break
			}
		}

		await $saveMoveForm.mutateAsync({
			body: {
				type: form.status!,
				item_review: form.review,
				item_rating: form.rating,
				item_length: form.hltbTime || null,
				item_title: form.title,
				game_id: selectedGame?.id || null,
				cover_image_url: selectedGame?.cover || fallbackPoster,
				difficulty
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
				review: '',
				difficulty: undefined
			}
			selectedGame = null
		}, 500)
	}

	function handleEmoteClick(emote: EmoteItem) {
		editorState.editor?.chain().focus().setImage({ src: emote.cdn_url }).run()
	}

	function toggleSpoiler() {
		editorState.editor?.chain().focus().toggleSpoilerMark().setTextSelection(0).run()
	}

	$effect(() => {
		if (!isDialogOpen) {
			bypassClickCount = 0
		}
	})

	$effect(() => {
		form.title
		form.status
		form.hltbTime
		form.rating
		form.review
		form.difficulty
		selectedGame
		bypassClickCount = 0
	})
</script>

<Dialog bind:open={isDialogOpen}>
	<DialogTrigger>
		{#snippet child({ props })}
			<Button {...props} class="w-80" disabled={!$eventActive}>Сделать ход</Button>
		{/snippet}
	</DialogTrigger>
	<DialogContent class="gap-3 overflow-hidden p-3 sm:max-w-[800px]" showCloseButton={false}>
		<DialogHeader>
			<DialogTitle aria-describedby="move form">
				Новый ход — {form.title || $myPlayer?.current_game}
			</DialogTitle>
		</DialogHeader>

		<div class="flex gap-3">
			<ImageLoader
				src={selectedGame?.cover || fallbackPoster}
				alt="game poster"
				class="h-[176px] w-[132px]"
			/>
			<div class="flex w-full flex-col gap-3">
				<div class="flex gap-3">
					<GameTitle bind:value={form.title} bind:selectedGame />
					<HltbLink gameTitle={form.title} />
				</div>

				<div class="flex max-w-158 gap-3">
					<GameStatusSelector {gameDuration} bind:value={form.status} />
					<HltbTimeSelector
						bind:value={form.hltbTime}
						bind:isInvalid={isHltbTimeInvalid}
						{gameDuration}
						disabled={form.status !== 'completed'}
					/>
					<DifficultySelector bind:value={form.difficulty} />
				</div>

				<div class="space-y-2.5">
					<div class="text-xl font-semibold">
						Оценка — {`${form.rating === null ? 'не указана' : form.rating}`}
					</div>
					<Rating bind:value={form.rating} />
				</div>

				<div class="relative">
					<TiptapEditor
						class="px-3 py-2"
						content={form.review}
						bind:editorState
						bind:value={form.review}
						extensions={{
							placeholderText: 'Отзыв'
						}}
						simple
					/>
					<div class="absolute right-1.5 bottom-1.5 flex flex-col">
						<Tooltip>
							<TooltipTrigger>
								<Button variant="ghost" size="icon" onclick={toggleSpoiler}>
									<WandIcon class="size-6" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Спойлер</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<EmotesPopover onEmoteClick={handleEmoteClick} />
							</TooltipTrigger>
							<TooltipContent>Смайлы</TooltipContent>
						</Tooltip>
					</div>
				</div>

				<div class="ml-auto w-[264px]">
					{#if hasHltbError && bypassClickCount < 5}
						<Tooltip>
							<TooltipTrigger>
								<Button
									class="w-full opacity-50 cursor-not-allowed"
									onclick={(e) => {
										e.preventDefault()
										bypassClickCount++
									}}
								>
									<BoxIcon />
									{buttonText}
								</Button>
							</TooltipTrigger>
							<TooltipContent class="max-w-[400px]">
								Ваше время меньше выбранного диапозона HLTB, согласно разделу 2 пункту 5 правил
								если время прохождения стримером меньше HLTB, то нужно изменить выбранный
								диапозон на своё время. ({5 - bypassClickCount} нажатий для обхода)
							</TooltipContent>
						</Tooltip>
					{:else}
						<Button class="w-full" disabled={!isFormFilled} onclick={saveReview}>
							<BoxIcon />
							{buttonText}
						</Button>
					{/if}
				</div>
			</div>
		</div>

		<DialogClose
			class="absolute top-3 right-3 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
		>
			<X class="size-5 stroke-4" />
		</DialogClose>
	</DialogContent>
</Dialog>
